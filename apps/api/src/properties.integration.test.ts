import { randomUUID } from "node:crypto";

import type {
  CreatePropertyInput,
  PropertyCreateResponse,
  PropertyListResponse,
} from "@propai/shared";
import { beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { clearDevInvitations } from "./lib/invitation-dev-store.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

type InvitationCreateResponse = {
  invitation: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
};

type AppInstance = Awaited<ReturnType<typeof buildApp>>;

type SignedUpUser = {
  userId: string;
  organizationId: string;
  cookie: string;
};

function samplePropertyPayload(overrides: Partial<CreatePropertyInput> = {}): CreatePropertyInput {
  return {
    title: "Austin Ranch Home",
    type: "single_family",
    priceUsdCents: 45_000_000,
    rentOrSale: "sale",
    bedrooms: 3,
    bathrooms: "2.5",
    sqFt: 2100,
    addressLine1: "123 Main St",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    ...overrides,
  };
}

async function brokerageSignUp(
  app: AppInstance,
  suffix: string,
  label: string,
): Promise<SignedUpUser> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    payload: {
      email: `prop-${label}-${suffix}@test.propai-os.local`,
      password: "password123",
      name: `Property Owner ${label}`,
      organizationName: `Property Brokerage ${label} ${suffix}`,
    },
  });

  expect(response.statusCode).toBe(201);

  const body = response.json() as BrokerageSignUpResponse;
  const cookie = normalizeCookieHeader(response.headers["set-cookie"]);

  expect(cookie).toBeDefined();
  expect(body.session.activeOrganizationId).toBe(body.organization.id);

  return {
    userId: body.user.id,
    organizationId: body.organization.id,
    cookie: cookie ?? "",
  };
}

async function inviteAndAcceptUser(
  app: AppInstance,
  ownerCookie: string,
  organizationId: string,
  role: "agent" | "manager" | "viewer",
  label: string,
  suffix: string,
): Promise<{ cookie: string; email: string }> {
  const email = `prop-${role}-${label}-${suffix}@test.propai-os.local`;

  const inviteResponse = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-invite",
    headers: {
      cookie: ownerCookie,
      "content-type": "application/json",
    },
    payload: { email, role },
  });

  expect(inviteResponse.statusCode).toBe(201);

  const inviteBody = inviteResponse.json() as InvitationCreateResponse;

  expect(inviteBody.invitation.organizationId).toBe(organizationId);
  expect(inviteBody.invitation.role).toBe(role);

  const signUpResponse = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: {
      email,
      password: "password123",
      name: `Property ${role} ${label}`,
    },
  });

  expect(signUpResponse.statusCode).toBe(200);

  const signUpCookie = normalizeCookieHeader(signUpResponse.headers["set-cookie"]);

  expect(signUpCookie).toBeDefined();

  const acceptResponse = await app.inject({
    method: "POST",
    url: "/api/auth/organization/accept-invitation",
    headers: {
      cookie: signUpCookie ?? "",
      "content-type": "application/json",
    },
    payload: { invitationId: inviteBody.invitation.id },
  });

  expect(acceptResponse.statusCode).toBe(200);

  const sessionCookie = normalizeCookieHeader(acceptResponse.headers["set-cookie"]) ?? signUpCookie;

  return { cookie: sessionCookie ?? "", email };
}

async function createProperty(
  app: AppInstance,
  cookie: string,
  payload: CreatePropertyInput = samplePropertyPayload(),
): Promise<PropertyCreateResponse> {
  const response = await app.inject({
    method: "POST",
    url: "/v1/properties",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    payload,
  });

  expect(response.statusCode).toBe(201);

  return response.json() as PropertyCreateResponse;
}

describe("Day 17 — properties integration", () => {
  beforeEach(() => {
    clearDevInvitations();
  });

  it("owner creates property via POST with createdBy set", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "owner");

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/properties",
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: samplePropertyPayload({ title: "Owner Listing" }),
    });

    expect(createResponse.statusCode).toBe(201);

    const body = createResponse.json() as PropertyCreateResponse;

    expect(body.property.title).toBe("Owner Listing");
    expect(body.property.createdBy).toBe(owner.userId);
    expect(body.property.tenantId).toBe(owner.organizationId);
    expect(body.property.softDeletedAt).toBeNull();

    await app.close();
  });

  it("owner lists properties including created row", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "list");

    const created = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({ title: "Listed Property" }),
    );

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/properties",
      headers: { cookie: owner.cookie },
    });

    expect(listResponse.statusCode).toBe(200);

    const listBody = listResponse.json() as PropertyListResponse;

    expect(listBody.items.some((item) => item.id === created.property.id)).toBe(true);

    await app.close();
  });

  it("agent B gets 404 when fetching agent A property by id", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "rbac-get");

    const agentA = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "agent",
      "a",
      suffix,
    );
    const agentB = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "agent",
      "b",
      suffix,
    );

    const created = await createProperty(
      app,
      agentA.cookie,
      samplePropertyPayload({ title: "Agent A Listing" }),
    );

    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/properties/${created.property.id}`,
      headers: { cookie: agentB.cookie },
    });

    expect(getResponse.statusCode).toBe(404);
    expect(getResponse.json()).toMatchObject({
      error: "Not Found",
      message: "Property not found.",
    });

    await app.close();
  });

  it("manager lists all tenant properties including agent listings", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "mgr-list");

    const agentA = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "agent",
      "mgr-a",
      suffix,
    );
    const manager = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "manager",
      "mgr",
      suffix,
    );

    const created = await createProperty(
      app,
      agentA.cookie,
      samplePropertyPayload({ title: "Manager Visible Listing" }),
    );

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/properties",
      headers: { cookie: manager.cookie },
    });

    expect(listResponse.statusCode).toBe(200);

    const listBody = listResponse.json() as PropertyListResponse;

    expect(listBody.items.some((item) => item.id === created.property.id)).toBe(true);

    await app.close();
  });

  it("agent patches own property", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "patch-own");

    const agent = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "agent",
      "patch",
      suffix,
    );

    const created = await createProperty(
      app,
      agent.cookie,
      samplePropertyPayload({ title: "Before Patch" }),
    );

    const patchResponse = await app.inject({
      method: "PATCH",
      url: `/v1/properties/${created.property.id}`,
      headers: {
        cookie: agent.cookie,
        "content-type": "application/json",
      },
      payload: { title: "After Patch" },
    });

    expect(patchResponse.statusCode).toBe(200);

    const patchBody = patchResponse.json() as PropertyCreateResponse;

    expect(patchBody.property.title).toBe("After Patch");
    expect(patchBody.property.id).toBe(created.property.id);

    await app.close();
  });

  it("agent gets 404 patching another agent's property", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "patch-other");

    const agentA = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "agent",
      "patch-a",
      suffix,
    );
    const agentB = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "agent",
      "patch-b",
      suffix,
    );

    const created = await createProperty(
      app,
      agentA.cookie,
      samplePropertyPayload({ title: "Agent A Only" }),
    );

    const patchResponse = await app.inject({
      method: "PATCH",
      url: `/v1/properties/${created.property.id}`,
      headers: {
        cookie: agentB.cookie,
        "content-type": "application/json",
      },
      payload: { title: "Blocked Patch" },
    });

    expect(patchResponse.statusCode).toBe(404);
    expect(patchResponse.json()).toMatchObject({
      error: "Not Found",
      message: "Property not found.",
    });

    await app.close();
  });

  it("filters list by status and minPriceUsdCents", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "filter");

    const lowActive = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({
        title: "Low Active",
        status: "active",
        priceUsdCents: 50_000_000,
      }),
    );
    await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({
        title: "Draft Listing",
        status: "draft",
        priceUsdCents: 30_000_000,
      }),
    );
    const highActive = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({
        title: "High Active",
        status: "active",
        priceUsdCents: 80_000_000,
      }),
    );

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/properties?status=active&minPriceUsdCents=60000000",
      headers: { cookie: owner.cookie },
    });

    expect(listResponse.statusCode).toBe(200);

    const listBody = listResponse.json() as PropertyListResponse;
    const ids = listBody.items.map((item) => item.id);

    expect(ids).toContain(highActive.property.id);
    expect(ids).not.toContain(lowActive.property.id);
    expect(listBody.items.every((item) => item.status === "active")).toBe(true);
    expect(listBody.items.every((item) => item.priceUsdCents >= 60_000_000)).toBe(true);

    await app.close();
  });

  it("cursor pagination returns nextCursor and non-overlapping pages", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "cursor");

    const first = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({ title: "Cursor One" }),
    );
    const second = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({ title: "Cursor Two" }),
    );
    const third = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({ title: "Cursor Three" }),
    );

    const pageOneResponse = await app.inject({
      method: "GET",
      url: "/v1/properties?limit=2",
      headers: { cookie: owner.cookie },
    });

    expect(pageOneResponse.statusCode).toBe(200);

    const pageOne = pageOneResponse.json() as PropertyListResponse;

    expect(pageOne.items).toHaveLength(2);
    expect(pageOne.nextCursor).toBeTypeOf("string");
    expect(pageOne.nextCursor).not.toBeNull();

    const pageTwoResponse = await app.inject({
      method: "GET",
      url: `/v1/properties?limit=2&cursor=${encodeURIComponent(pageOne.nextCursor ?? "")}`,
      headers: { cookie: owner.cookie },
    });

    expect(pageTwoResponse.statusCode).toBe(200);

    const pageTwo = pageTwoResponse.json() as PropertyListResponse;
    const pageOneIds = new Set(pageOne.items.map((item) => item.id));
    const pageTwoIds = pageTwo.items.map((item) => item.id);

    expect(pageTwoIds.every((id) => !pageOneIds.has(id))).toBe(true);

    const allIds = [...pageOne.items, ...pageTwo.items].map((item) => item.id);

    expect(allIds).toContain(first.property.id);
    expect(allIds).toContain(second.property.id);
    expect(allIds).toContain(third.property.id);

    await app.close();
  });

  it("DELETE soft-deletes property and excludes it from list", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "delete");

    const created = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({ title: "To Delete" }),
    );

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/v1/properties/${created.property.id}`,
      headers: { cookie: owner.cookie },
    });

    expect(deleteResponse.statusCode).toBe(200);

    const deleteBody = deleteResponse.json() as PropertyCreateResponse;

    expect(deleteBody.property.softDeletedAt).not.toBeNull();

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/properties",
      headers: { cookie: owner.cookie },
    });

    expect(listResponse.statusCode).toBe(200);

    const listBody = listResponse.json() as PropertyListResponse;

    expect(listBody.items.some((item) => item.id === created.property.id)).toBe(false);

    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/properties/${created.property.id}`,
      headers: { cookie: owner.cookie },
    });

    expect(getResponse.statusCode).toBe(404);

    await app.close();
  });

  it("viewer gets 403 on GET /v1/properties", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "viewer");

    const viewer = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "viewer",
      "read",
      suffix,
    );

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/properties",
      headers: { cookie: viewer.cookie },
    });

    expect(listResponse.statusCode).toBe(403);
    expect(listResponse.json()).toMatchObject({
      error: "Forbidden",
      message: "Insufficient permissions for this action.",
    });

    await app.close();
  });

  it("returns 401 for unauthenticated GET /v1/properties", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/properties",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "Unauthorized" });

    await app.close();
  });

  it("tenant B session cannot GET tenant A property by id", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    const tenantA = await brokerageSignUp(app, suffix, "tenant-a");
    const tenantB = await brokerageSignUp(app, suffix, "tenant-b");

    const created = await createProperty(
      app,
      tenantA.cookie,
      samplePropertyPayload({ title: "Tenant A Secret" }),
    );

    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/properties/${created.property.id}`,
      headers: { cookie: tenantB.cookie },
    });

    expect(getResponse.statusCode).toBe(404);
    expect(getResponse.json()).toMatchObject({
      error: "Not Found",
      message: "Property not found.",
    });

    await app.close();
  });
});
