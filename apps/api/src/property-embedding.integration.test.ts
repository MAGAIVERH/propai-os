import { randomUUID } from "node:crypto";

import type {
  CreatePropertyInput,
  PropertyCreateResponse,
} from "@propai/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "./app.js";
import { clearDevInvitations } from "./lib/invitation-dev-store.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";
import { enqueueGenerateEmbeddingJob } from "./modules/ai/queues/generate-embedding-queue.js";

vi.mock("./modules/ai/queues/generate-embedding-queue.js", () => ({
  enqueueGenerateEmbeddingJob: vi.fn(),
}));

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

type AppInstance = Awaited<ReturnType<typeof buildApp>>;

function samplePropertyPayload(
  overrides: Partial<CreatePropertyInput> = {},
): CreatePropertyInput {
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
): Promise<{ cookie: string; organizationId: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    payload: {
      email: `embed-owner-${suffix}@test.propai-os.local`,
      password: "password123",
      name: "Embedding Owner",
      organizationName: `Embedding Brokerage ${suffix}`,
    },
  });

  expect(response.statusCode).toBe(201);

  const body = response.json() as BrokerageSignUpResponse;
  const cookie = normalizeCookieHeader(response.headers["set-cookie"]);

  return {
    cookie: cookie ?? "",
    organizationId: body.organization.id,
  };
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

const originalEnv = { ...process.env };

describe("Day 29 — property embedding enqueue integration", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = "test";
    process.env.ENABLE_SEMANTIC_SEARCH = "true";
    clearDevInvitations();
    vi.mocked(enqueueGenerateEmbeddingJob).mockReset();
    vi.mocked(enqueueGenerateEmbeddingJob).mockResolvedValue("job-embed-1");
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("enqueues embedding when PATCH publishes draft to active", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix);
    const created = await createProperty(app, owner.cookie);

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/properties/${created.property.id}`,
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: { status: "active" },
    });

    expect(response.statusCode).toBe(200);
    expect(enqueueGenerateEmbeddingJob).toHaveBeenCalledWith({
      tenantId: owner.organizationId,
      propertyId: created.property.id,
    });

    await app.close();
  });

  it("does not enqueue when ENABLE_SEMANTIC_SEARCH is false", async () => {
    process.env.ENABLE_SEMANTIC_SEARCH = "false";

    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix);
    const created = await createProperty(app, owner.cookie);

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/properties/${created.property.id}`,
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: { status: "active" },
    });

    expect(response.statusCode).toBe(200);
    expect(enqueueGenerateEmbeddingJob).not.toHaveBeenCalled();

    await app.close();
  });

  it("enqueues when POST creates an active property", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix);

    const created = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({ status: "active" }),
    );

    expect(enqueueGenerateEmbeddingJob).toHaveBeenCalledWith({
      tenantId: owner.organizationId,
      propertyId: created.property.id,
    });

    await app.close();
  });

  it("re-enqueues when active property title changes", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix);
    const created = await createProperty(
      app,
      owner.cookie,
      samplePropertyPayload({ status: "active" }),
    );

    vi.mocked(enqueueGenerateEmbeddingJob).mockClear();

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/properties/${created.property.id}`,
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: { title: "Updated Austin Ranch Home" },
    });

    expect(response.statusCode).toBe(200);
    expect(enqueueGenerateEmbeddingJob).toHaveBeenCalledWith({
      tenantId: owner.organizationId,
      propertyId: created.property.id,
    });

    await app.close();
  });

  it("does not fail PATCH when enqueue throws", async () => {
    vi.mocked(enqueueGenerateEmbeddingJob).mockRejectedValue(
      new Error("Redis unavailable"),
    );

    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix);
    const created = await createProperty(app, owner.cookie);

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/properties/${created.property.id}`,
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: { status: "active" },
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });
});
