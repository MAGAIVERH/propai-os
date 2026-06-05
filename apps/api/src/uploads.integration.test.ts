import { randomUUID } from "node:crypto";

import type {
  CreatePropertyInput,
  PresignDownloadResponse,
  PresignUploadResponse,
  PropertyCreateResponse,
} from "@propai/shared";
import { UPLOAD_MAX_BYTES } from "@propai/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./lib/storage-config.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./lib/storage-config.js")>();

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
import {
  createPresignedGetUrl,
  createPresignedPutUrl,
} from "./lib/s3-client.js";
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

function samplePropertyPayload(
  overrides: Partial<CreatePropertyInput> = {},
): CreatePropertyInput {
  return {
    title: "Upload Test Home",
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
      email: `upload-${label}-${suffix}@test.propai-os.local`,
      password: "password123",
      name: `Upload Owner ${label}`,
      organizationName: `Upload Brokerage ${label} ${suffix}`,
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
  const email = `upload-${role}-${label}-${suffix}@test.propai-os.local`;

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
      name: `Upload ${role} ${label}`,
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

  const sessionCookie =
    normalizeCookieHeader(acceptResponse.headers["set-cookie"]) ?? signUpCookie;

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
): Promise<{ statusCode: number; body: PresignUploadResponse | { error: string; message: string } }> {
  const response = await app.inject({
    method: "POST",
    url: "/v1/uploads/presign",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    payload,
  });

  return {
    statusCode: response.statusCode,
    body: response.json() as PresignUploadResponse | { error: string; message: string },
  };
}

function mockStorageReady(): void {
  vi.mocked(getStorageConfig).mockReturnValue({ ...mockStorageConfig });
  vi.mocked(createPresignedPutUrl).mockResolvedValue(
    "https://storage.example/upload",
  );
  vi.mocked(createPresignedGetUrl).mockResolvedValue(
    "https://storage.example/download",
  );
}

describe("Day 18 — uploads integration", () => {
  beforeEach(() => {
    clearDevInvitations();
    vi.mocked(getStorageConfig).mockReset();
    vi.mocked(createPresignedPutUrl).mockReset();
    vi.mocked(createPresignedGetUrl).mockReset();
    mockStorageReady();
  });

  it("returns 401 for unauthenticated POST /v1/uploads/presign", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "POST",
      url: "/v1/uploads/presign",
      headers: { "content-type": "application/json" },
      payload: {
        propertyId: randomUUID(),
        contentType: "image/jpeg",
        contentLength: 1024,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "Unauthorized" });

    await app.close();
  });

  it("returns 403 for viewer role on POST /v1/uploads/presign", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "viewer");

    const viewer = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "viewer",
      "presign",
      suffix,
    );

    const created = await createProperty(app, owner.cookie);

    const response = await app.inject({
      method: "POST",
      url: "/v1/uploads/presign",
      headers: {
        cookie: viewer.cookie,
        "content-type": "application/json",
      },
      payload: {
        propertyId: created.property.id,
        contentType: "image/jpeg",
        contentLength: 1024,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: "Forbidden",
      message: "Insufficient permissions for this action.",
    });

    await app.close();
  });

  it("returns 404 when agent presigns for another agent's property", async () => {
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
      samplePropertyPayload({ title: "Agent A Upload Target" }),
    );

    const result = await presignUpload(app, agentB.cookie, {
      propertyId: created.property.id,
      contentType: "image/jpeg",
      contentLength: 2048,
    });

    expect(result.statusCode).toBe(404);
    expect(result.body).toMatchObject({
      error: "Not Found",
      message: "Property not found.",
    });

    await app.close();
  });

  it("allows manager to presign upload for any tenant property", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "manager");

    const agent = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "agent",
      "listed",
      suffix,
    );
    const manager = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "manager",
      "upload",
      suffix,
    );

    const created = await createProperty(
      app,
      agent.cookie,
      samplePropertyPayload({ title: "Manager Upload Target" }),
    );

    const result = await presignUpload(app, manager.cookie, {
      propertyId: created.property.id,
      contentType: "image/jpeg",
      contentLength: 4096,
    });

    expect(result.statusCode).toBe(200);

    const body = result.body as PresignUploadResponse;

    expect(body.uploadUrl).toBe("https://storage.example/upload");
    expect(body.key).toMatch(
      new RegExp(
        `^tenant/${owner.organizationId}/property/${created.property.id}/[0-9a-f-]{36}\\.jpg$`,
      ),
    );
    expect(body.headers).toEqual({ "Content-Type": "image/jpeg" });
    expect(body.expiresAt).toBeTypeOf("string");

    expect(createPresignedPutUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        key: body.key,
        contentType: "image/jpeg",
        contentLength: 4096,
      }),
      expect.objectContaining({ bucket: "propai-uploads" }),
    );

    await app.close();
  });

  it("returns 400 for non-image contentType application/pdf", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "pdf");

    const created = await createProperty(app, owner.cookie);

    const response = await app.inject({
      method: "POST",
      url: "/v1/uploads/presign",
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: {
        propertyId: created.property.id,
        contentType: "application/pdf",
        contentLength: 1024,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "Bad Request",
      message: "Content-Type must be image/*",
    });

    await app.close();
  });

  it("returns 400 when contentLength exceeds 10MB", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "oversize");

    const created = await createProperty(app, owner.cookie);

    const response = await app.inject({
      method: "POST",
      url: "/v1/uploads/presign",
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: {
        propertyId: created.property.id,
        contentType: "image/jpeg",
        contentLength: UPLOAD_MAX_BYTES + 1,
      },
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });

  it("returns 404 when download key belongs to another tenant", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    const tenantA = await brokerageSignUp(app, suffix, "tenant-a");
    const tenantB = await brokerageSignUp(app, suffix, "tenant-b");

    const created = await createProperty(
      app,
      tenantA.cookie,
      samplePropertyPayload({ title: "Tenant A Photo Target" }),
    );

    const presignResult = await presignUpload(app, tenantA.cookie, {
      propertyId: created.property.id,
      contentType: "image/jpeg",
      contentLength: 1024,
    });

    expect(presignResult.statusCode).toBe(200);

    const uploadBody = presignResult.body as PresignUploadResponse;

    const downloadResponse = await app.inject({
      method: "GET",
      url: `/v1/uploads/presign-download?key=${encodeURIComponent(uploadBody.key)}`,
      headers: { cookie: tenantB.cookie },
    });

    expect(downloadResponse.statusCode).toBe(404);
    expect(downloadResponse.json()).toMatchObject({
      error: "Not Found",
      message: "Object key not found.",
    });

    await app.close();
  });

  it("returns presigned download URL for valid tenant key", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "download");

    const created = await createProperty(app, owner.cookie);

    const presignResult = await presignUpload(app, owner.cookie, {
      propertyId: created.property.id,
      contentType: "image/png",
      contentLength: 512,
    });

    expect(presignResult.statusCode).toBe(200);

    const uploadBody = presignResult.body as PresignUploadResponse;

    const downloadResponse = await app.inject({
      method: "GET",
      url: `/v1/uploads/presign-download?key=${encodeURIComponent(uploadBody.key)}`,
      headers: { cookie: owner.cookie },
    });

    expect(downloadResponse.statusCode).toBe(200);

    const downloadBody = downloadResponse.json() as PresignDownloadResponse;

    expect(downloadBody.downloadUrl).toBe("https://storage.example/download");
    expect(downloadBody.expiresAt).toBeTypeOf("string");

    expect(createPresignedGetUrl).toHaveBeenCalledWith(
      expect.objectContaining({ key: uploadBody.key }),
      expect.objectContaining({ bucket: "propai-uploads" }),
    );

    await app.close();
  });

  it("returns 503 when object storage is not configured", async () => {
    vi.mocked(getStorageConfig).mockReturnValue(null);

    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "no-storage");

    const created = await createProperty(app, owner.cookie);

    const response = await app.inject({
      method: "POST",
      url: "/v1/uploads/presign",
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: {
        propertyId: created.property.id,
        contentType: "image/jpeg",
        contentLength: 1024,
      },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      error: "Service Unavailable",
      message: "Object storage is not configured.",
    });

    await app.close();
  });
});
