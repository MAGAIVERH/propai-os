import { getAppDb, testItems } from "@propai/db";
import { describe, expect, it, beforeAll, afterAll } from "vitest";

import { buildApp } from "./app.js";
import { createMockSessionAuthorization } from "./modules/auth/session.js";
import { seedRlsTestData, teardownRlsTestData, type RlsTestSeed } from "./test/rls-test-helpers.js";

type TestItemsListResponse = {
  items: Array<{
    id: string;
    tenantId: string;
    name: string;
  }>;
};

describe("RLS API tenant isolation", () => {
  let seed: RlsTestSeed;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    seed = await seedRlsTestData();
  });

  afterAll(async () => {
    await teardownRlsTestData();
  });

  it("returns 401 for unauthenticated GET /v1/test-items", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/test-items",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: "Unauthorized",
    });

    await app.close();
  });

  it("returns only tenant A rows for tenant A session", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: {
        authorization: createMockSessionAuthorization(seed.tenantAId),
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as TestItemsListResponse;

    expect(body.items).toHaveLength(2);
    expect(body.items.every((item) => item.tenantId === seed.tenantAId)).toBe(true);

    await app.close();
  });

  it("returns only tenant B rows for tenant B session", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: {
        authorization: createMockSessionAuthorization(seed.tenantBId),
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as TestItemsListResponse;

    expect(body.items).toHaveLength(2);
    expect(body.items.every((item) => item.tenantId === seed.tenantBId)).toBe(true);

    await app.close();
  });

  it("returns 403 when session has unknown organization id", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: {
        authorization: createMockSessionAuthorization("00000000-0000-4000-8000-000000000099"),
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: "Forbidden",
    });

    await app.close();
  });

  it("creates items scoped to session tenant only", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/test-items",
      headers: {
        authorization: createMockSessionAuthorization(seed.tenantAId),
        "content-type": "application/json",
      },
      payload: { name: "Item A3" },
    });

    expect(createResponse.statusCode).toBe(201);

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: {
        authorization: createMockSessionAuthorization(seed.tenantBId),
      },
    });

    const tenantBBody = listResponse.json() as TestItemsListResponse;

    expect(tenantBBody.items).toHaveLength(2);
    expect(tenantBBody.items.some((item) => item.name === "Item A3")).toBe(false);

    await app.close();
  });

  it("returns zero rows from app db without tenant context", async () => {
    const rows = await getAppDb().select().from(testItems);
    expect(rows).toHaveLength(0);
  });
});
