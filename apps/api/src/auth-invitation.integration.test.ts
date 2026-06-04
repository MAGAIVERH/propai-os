import { randomUUID } from "node:crypto";

import { describe, expect, it, beforeEach } from "vitest";

import { buildApp } from "./app.js";
import { clearDevInvitations } from "./lib/invitation-dev-store.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  organization: { id: string };
  session: { activeOrganizationId: string };
};

type SessionResponse = {
  session: {
    activeOrganizationId: string | null;
  } | null;
  user: { email: string } | null;
};

type InvitationCreateResponse = {
  invitation: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
};

type TestItemsListResponse = {
  items: Array<{
    name: string;
    tenantId: string;
  }>;
};

describe("Brokerage invitation flow", () => {
  beforeEach(() => {
    clearDevInvitations();
  });

  it("owner invites agent; agent accepts and sees org-scoped test-items", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const agentEmail = `agent-${suffix}@test.propai-os.local`;

    const ownerSignUp = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `owner-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "Invite Owner",
        organizationName: `Invite Brokerage ${suffix}`,
      },
    });

    expect(ownerSignUp.statusCode).toBe(201);

    const ownerBody = ownerSignUp.json() as BrokerageSignUpResponse;
    const ownerCookie = normalizeCookieHeader(ownerSignUp.headers["set-cookie"]);
    const organizationId = ownerBody.organization.id;

    expect(ownerCookie).toBeDefined();
    expect(ownerBody.session.activeOrganizationId).toBe(organizationId);

    const seedItemResponse = await app.inject({
      method: "POST",
      url: "/v1/test-items",
      headers: {
        cookie: ownerCookie ?? "",
        "content-type": "application/json",
      },
      payload: { name: "org-a-shared" },
    });

    expect(seedItemResponse.statusCode).toBe(201);

    const inviteResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-invite",
      headers: {
        cookie: ownerCookie ?? "",
        "content-type": "application/json",
      },
      payload: {
        email: agentEmail,
        role: "agent",
      },
    });

    expect(inviteResponse.statusCode).toBe(201);

    const inviteBody = inviteResponse.json() as InvitationCreateResponse;

    expect(inviteBody.invitation.email).toBe(agentEmail);
    expect(inviteBody.invitation.role).toBe("agent");
    expect(inviteBody.invitation.organizationId).toBe(organizationId);

    const agentSignUp = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      payload: {
        email: agentEmail,
        password: "password123",
        name: "Invited Agent",
      },
    });

    expect(agentSignUp.statusCode).toBe(200);

    const agentCookie = normalizeCookieHeader(agentSignUp.headers["set-cookie"]);

    expect(agentCookie).toBeDefined();

    const acceptResponse = await app.inject({
      method: "POST",
      url: "/api/auth/organization/accept-invitation",
      headers: {
        cookie: agentCookie ?? "",
        "content-type": "application/json",
      },
      payload: {
        invitationId: inviteBody.invitation.id,
      },
    });

    expect(acceptResponse.statusCode).toBe(200);

    const acceptCookie =
      normalizeCookieHeader(acceptResponse.headers["set-cookie"]) ?? agentCookie;

    const sessionResponse = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
      headers: { cookie: acceptCookie ?? "" },
    });

    expect(sessionResponse.statusCode).toBe(200);

    const sessionBody = sessionResponse.json() as SessionResponse;

    expect(sessionBody.user?.email).toBe(agentEmail);
    expect(sessionBody.session?.activeOrganizationId).toBe(organizationId);

    const itemsResponse = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: { cookie: acceptCookie ?? "" },
    });

    expect(itemsResponse.statusCode).toBe(200);

    const itemsBody = itemsResponse.json() as TestItemsListResponse;

    expect(itemsBody.items.length).toBeGreaterThanOrEqual(1);
    expect(itemsBody.items.some((item) => item.name === "org-a-shared")).toBe(
      true,
    );
    expect(
      itemsBody.items.every((item) => item.tenantId === organizationId),
    ).toBe(true);

    const otherOrgSuffix = `${suffix}-other`;
    const otherOwnerSignUp = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `other-owner-${otherOrgSuffix}@test.propai-os.local`,
        password: "password123",
        name: "Other Owner",
        organizationName: `Other Brokerage ${otherOrgSuffix}`,
      },
    });

    expect(otherOwnerSignUp.statusCode).toBe(201);

    const otherOwnerCookie = normalizeCookieHeader(
      otherOwnerSignUp.headers["set-cookie"],
    );

    const otherItemResponse = await app.inject({
      method: "POST",
      url: "/v1/test-items",
      headers: {
        cookie: otherOwnerCookie ?? "",
        "content-type": "application/json",
      },
      payload: { name: "other-org-only" },
    });

    expect(otherItemResponse.statusCode).toBe(201);

    const agentItemsAgain = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: { cookie: acceptCookie ?? "" },
    });

    const agentItemsBody = agentItemsAgain.json() as TestItemsListResponse;

    expect(agentItemsBody.items.some((item) => item.name === "other-org-only")).toBe(
      false,
    );

    await app.close();
  });

  it("returns 401 when inviting without session", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-invite",
      payload: {
        email: "no-session@test.propai-os.local",
        role: "agent",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: "Unauthorized",
    });

    await app.close();
  });

  it("returns 403 when a non-owner invites", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const managerEmail = `manager-${suffix}@test.propai-os.local`;

    const ownerSignUp = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `owner-403-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "Owner 403",
        organizationName: `Forbidden Brokerage ${suffix}`,
      },
    });

    expect(ownerSignUp.statusCode).toBe(201);

    const ownerCookie = normalizeCookieHeader(ownerSignUp.headers["set-cookie"]);

    const managerInvite = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-invite",
      headers: {
        cookie: ownerCookie ?? "",
        "content-type": "application/json",
      },
      payload: {
        email: managerEmail,
        role: "manager",
      },
    });

    expect(managerInvite.statusCode).toBe(201);

    const managerSignUp = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      payload: {
        email: managerEmail,
        password: "password123",
        name: "Invited Manager",
      },
    });

    expect(managerSignUp.statusCode).toBe(200);

    const managerCookie = normalizeCookieHeader(
      managerSignUp.headers["set-cookie"],
    );

    const managerInviteBody = managerInvite.json() as InvitationCreateResponse;

    const managerAccept = await app.inject({
      method: "POST",
      url: "/api/auth/organization/accept-invitation",
      headers: {
        cookie: managerCookie ?? "",
        "content-type": "application/json",
      },
      payload: { invitationId: managerInviteBody.invitation.id },
    });

    expect(managerAccept.statusCode).toBe(200);

    const managerSessionCookie =
      normalizeCookieHeader(managerAccept.headers["set-cookie"]) ??
      managerCookie;

    const forbiddenInvite = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-invite",
      headers: {
        cookie: managerSessionCookie ?? "",
        "content-type": "application/json",
      },
      payload: {
        email: `blocked-${suffix}@test.propai-os.local`,
        role: "viewer",
      },
    });

    expect(forbiddenInvite.statusCode).toBe(403);
    expect(forbiddenInvite.json()).toMatchObject({
      error: "Forbidden",
    });

    await app.close();
  });
});
