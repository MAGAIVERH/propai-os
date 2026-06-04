import { describe, expect, it, beforeAll, afterAll } from "vitest";

import { buildApp } from "../../app.js";
import { createMockSessionAuthorization } from "../auth/session.js";
import {
  seedRlsTestData,
  teardownRlsTestData,
  type RlsTestSeed,
} from "../../test/rls-test-helpers.js";

describe("Tenants module", () => {
  let seed: RlsTestSeed;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    seed = await seedRlsTestData();
  });

  afterAll(async () => {
    await teardownRlsTestData();
  });

  it("GET /v1/organization/me returns active organization profile", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/organization/me",
      headers: {
        authorization: createMockSessionAuthorization(seed.tenantAId),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: seed.tenantAId,
      name: expect.any(String) as unknown as string,
      slug: expect.any(String) as unknown as string,
    });

    await app.close();
  });

  it("returns 401 without session", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/organization/me",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "Unauthorized" });

    await app.close();
  });
});
