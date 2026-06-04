import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";

describe("Health & readiness (integration)", () => {
  it("GET /health returns 200 and status ok without auth", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok" });

    await app.close();
  });

  it("GET /ready returns 200 when DATABASE_URL is valid", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });

    await app.close();
  });
});
