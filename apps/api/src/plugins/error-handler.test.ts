import { describe, expect, it, beforeAll, afterAll } from "vitest";

import { buildApp } from "../app.js";
import { createMockSessionAuthorization } from "../modules/auth/session.js";
import {
  seedRlsTestData,
  teardownRlsTestData,
  type RlsTestSeed,
} from "../test/rls-test-helpers.js";

describe("Global error handler", () => {
  let seed: RlsTestSeed;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    seed = await seedRlsTestData();
  });

  afterAll(async () => {
    await teardownRlsTestData();
  });

  it("returns 400 for invalid POST /v1/test-items body (Zod)", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "POST",
      url: "/v1/test-items",
      headers: {
        authorization: createMockSessionAuthorization(seed.tenantAId),
        "content-type": "application/json",
      },
      payload: { name: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "Bad Request",
      message: expect.any(String),
    });

    await app.close();
  });

  it("returns 500 JSON for unhandled errors", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    app.get("/__test-unhandled-error", async () => {
      throw new Error("Intentional test failure");
    });

    const response = await app.inject({
      method: "GET",
      url: "/__test-unhandled-error",
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({
      error: "Internal Server Error",
      message: "Intentional test failure",
    });

    await app.close();
  });
});
