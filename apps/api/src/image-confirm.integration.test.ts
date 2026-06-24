import { randomUUID } from "node:crypto";

import { propertyImages, runInTenantContext } from "@propai/db";
import type {
  AuditLogListResponse,
  CreatePropertyInput,
  ImageConfirmResponse,
  PresignUploadResponse,
  PropertyCreateResponse,
} from "@propai/shared";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./lib/storage-config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/storage-config.js")>();

  return {
    ...actual,
    getStorageConfig: vi.fn(),
  };
});

vi.mock("./lib/s3-client.js", () => ({
  createPresignedPutUrl: vi.fn(),
  createPresignedGetUrl: vi.fn(),
  getS3Client: vi.fn(),
  resetS3ClientCache: vi.fn(),
}));

import { buildApp } from "./app.js";
import { clearDevInvitations } from "./lib/invitation-dev-store.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";
import { createPresignedPutUrl } from "./lib/s3-client.js";
import { getStorageConfig } from "./lib/storage-config.js";

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

const mockStorageConfig = {
  endpoint: "http://localhost:9000",
  region: "us-east-1",
  bucket: "propai-uploads",
  accessKeyId: "minioadmin",
  secretAccessKey: "minioadmin",
  presignExpiresSeconds: 900,
} as const;

function samplePropertyPayload(overrides: Partial<CreatePropertyInput> = {}): CreatePropertyInput {
  return {
    title: "Confirm Test Home",
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
      email: `confirm-${label}-${suffix}@test.propai-os.local`,
      password: "password123",
      name: `Confirm Owner ${label}`,
      organizationName: `Confirm Brokerage ${label} ${suffix}`,
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
  const email = `confirm-${role}-${label}-${suffix}@test.propai-os.local`;

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
      name: `Confirm ${role} ${label}`,
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

async function presignUpload(
  app: AppInstance,
  cookie: string,
  payload: {
    propertyId: string;
    contentType: string;
    contentLength: number;
  },
): Promise<PresignUploadResponse> {
  const response = await app.inject({
    method: "POST",
    url: "/v1/uploads/presign",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    payload,
  });

  expect(response.statusCode).toBe(200);

  return response.json() as PresignUploadResponse;
}

async function confirmImage(
  app: AppInstance,
  cookie: string,
  propertyId: string,
  payload: {
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    sortOrder?: number;
  },
): Promise<{
  statusCode: number;
  body: ImageConfirmResponse | { error: string; message: string };
}> {
  const response = await app.inject({
    method: "POST",
    url: `/v1/properties/${propertyId}/images/confirm`,
    headers: {
      cookie,
      "content-type": "application/json",
    },
    payload,
  });

  return {
    statusCode: response.statusCode,
    body: response.json() as ImageConfirmResponse | { error: string; message: string },
  };
}

function mockStorageReady(): void {
  vi.mocked(getStorageConfig).mockReturnValue({ ...mockStorageConfig });
  vi.mocked(createPresignedPutUrl).mockResolvedValue("https://storage.example/upload");
}

describe("Day 21 — image confirm integration", () => {
  beforeEach(() => {
    clearDevInvitations();
    vi.mocked(getStorageConfig).mockReset();
    vi.mocked(createPresignedPutUrl).mockReset();
    mockStorageReady();
  });

  it("returns 401 for unauthenticated POST /v1/properties/:id/images/confirm", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "POST",
      url: `/v1/properties/${randomUUID()}/images/confirm`,
      headers: { "content-type": "application/json" },
      payload: {
        objectKey: "tenant/x/property/y/z.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "Unauthorized" });

    await app.close();
  });

  it("returns 403 for viewer role on image confirm", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "viewer");

    const viewer = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "viewer",
      "confirm",
      suffix,
    );

    const created = await createProperty(app, owner.cookie);
    const presign = await presignUpload(app, owner.cookie, {
      propertyId: created.property.id,
      contentType: "image/jpeg",
      contentLength: 1024,
    });

    const result = await confirmImage(app, viewer.cookie, created.property.id, {
      objectKey: presign.key,
      mimeType: "image/jpeg",
      sizeBytes: 1024,
    });

    expect(result.statusCode).toBe(403);
    expect(result.body).toMatchObject({
      error: "Forbidden",
      message: "Insufficient permissions for this action.",
    });

    await app.close();
  });

  it("persists property_images row after presign and confirm", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "happy");

    const created = await createProperty(app, owner.cookie);
    const presign = await presignUpload(app, owner.cookie, {
      propertyId: created.property.id,
      contentType: "image/jpeg",
      contentLength: 2048,
    });

    const result = await confirmImage(app, owner.cookie, created.property.id, {
      objectKey: presign.key,
      mimeType: "image/jpeg",
      sizeBytes: 2048,
      sortOrder: 1,
    });

    expect(result.statusCode).toBe(201);

    const body = result.body as ImageConfirmResponse;

    expect(body.image.propertyId).toBe(created.property.id);
    expect(body.image.storageKey).toBe(presign.key);
    expect(body.image.sortOrder).toBe(1);
    expect(body.image.isPrimary).toBe(false);
    expect(body.image.createdAt).toBeTypeOf("string");

    const dbRows = await runInTenantContext(owner.organizationId, async (tx) => {
      return tx
        .select({
          id: propertyImages.id,
          storageKey: propertyImages.storageKey,
          sortOrder: propertyImages.sortOrder,
        })
        .from(propertyImages)
        .where(eq(propertyImages.propertyId, created.property.id));
    });

    expect(dbRows).toHaveLength(1);
    expect(dbRows[0]?.id).toBe(body.image.id);
    expect(dbRows[0]?.storageKey).toBe(presign.key);
    expect(dbRows[0]?.sortOrder).toBe(1);

    await app.close();
  });

  it("writes photo.uploaded audit event on confirm", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "audit");

    const created = await createProperty(app, owner.cookie);
    const presign = await presignUpload(app, owner.cookie, {
      propertyId: created.property.id,
      contentType: "image/png",
      contentLength: 512,
    });

    const result = await confirmImage(app, owner.cookie, created.property.id, {
      objectKey: presign.key,
      mimeType: "image/png",
      sizeBytes: 512,
    });

    expect(result.statusCode).toBe(201);

    const confirmBody = result.body as ImageConfirmResponse;

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
      headers: { cookie: owner.cookie },
    });

    expect(auditResponse.statusCode).toBe(200);

    const auditBody = auditResponse.json() as AuditLogListResponse;

    expect(
      auditBody.items.some(
        (entry) =>
          entry.action === "photo.uploaded" &&
          entry.entityType === "property_image" &&
          entry.entityId === confirmBody.image.id &&
          entry.metadata.propertyId === created.property.id &&
          entry.metadata.objectKey === presign.key &&
          entry.metadata.mimeType === "image/png" &&
          entry.metadata.sizeBytes === 512,
      ),
    ).toBe(true);

    await app.close();
  });

  it("returns 404 when confirming with another tenant's object key", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    const tenantA = await brokerageSignUp(app, suffix, "tenant-a");
    const tenantB = await brokerageSignUp(app, suffix, "tenant-b");

    const createdA = await createProperty(
      app,
      tenantA.cookie,
      samplePropertyPayload({ title: "Tenant A Photo" }),
    );
    const createdB = await createProperty(
      app,
      tenantB.cookie,
      samplePropertyPayload({ title: "Tenant B Photo" }),
    );

    const presignA = await presignUpload(app, tenantA.cookie, {
      propertyId: createdA.property.id,
      contentType: "image/jpeg",
      contentLength: 1024,
    });

    const result = await confirmImage(app, tenantB.cookie, createdB.property.id, {
      objectKey: presignA.key,
      mimeType: "image/jpeg",
      sizeBytes: 1024,
    });

    expect(result.statusCode).toBe(404);
    expect(result.body).toMatchObject({
      error: "Not Found",
      message: "Object key not found.",
    });

    await app.close();
  });

  it("returns 400 when object key property does not match route param", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "mismatch");

    const propertyA = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({ title: "Property A" }),
    );
    const propertyB = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({ title: "Property B" }),
    );

    const presignA = await presignUpload(app, owner.cookie, {
      propertyId: propertyA.property.id,
      contentType: "image/jpeg",
      contentLength: 1024,
    });

    const result = await confirmImage(app, owner.cookie, propertyB.property.id, {
      objectKey: presignA.key,
      mimeType: "image/jpeg",
      sizeBytes: 1024,
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "Bad Request",
      message: "Invalid object key format.",
    });

    await app.close();
  });

  it("returns 404 when agent confirms for another agent's property", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "agent-scope");

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
      samplePropertyPayload({ title: "Agent A Property" }),
    );

    const presign = await presignUpload(app, agentA.cookie, {
      propertyId: created.property.id,
      contentType: "image/jpeg",
      contentLength: 1024,
    });

    const result = await confirmImage(app, agentB.cookie, created.property.id, {
      objectKey: presign.key,
      mimeType: "image/jpeg",
      sizeBytes: 1024,
    });

    expect(result.statusCode).toBe(404);
    expect(result.body).toMatchObject({
      error: "Not Found",
      message: "Property not found.",
    });

    await app.close();
  });

  it("returns 400 when mimeType does not match object key extension", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "mime");

    const created = await createProperty(app, owner.cookie);
    const presign = await presignUpload(app, owner.cookie, {
      propertyId: created.property.id,
      contentType: "image/jpeg",
      contentLength: 1024,
    });

    const result = await confirmImage(app, owner.cookie, created.property.id, {
      objectKey: presign.key,
      mimeType: "image/png",
      sizeBytes: 1024,
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "Bad Request",
      message: "MIME type does not match the object key extension.",
    });

    await app.close();
  });
});
