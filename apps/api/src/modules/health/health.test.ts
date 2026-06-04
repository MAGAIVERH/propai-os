import { describe, expect, it, vi } from "vitest";

import { buildApp } from "../../app.js";
import * as dbPing from "./db-ping.js";

describe("Health module", () => {
  it("GET /health returns ok with app metadata", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok" });
    expect(response.headers["x-content-type-options"]).toBe("nosniff");

    await app.close();
  });

  it("GET /ready returns ok when database is reachable", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });

    await app.close();
  });

  it("GET /ready returns 503 when database ping fails", async () => {
    vi.spyOn(dbPing, "pingDatabase").mockResolvedValueOnce(false);

    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: "degraded",
      checks: { database: "down" },
    });

    vi.restoreAllMocks();
    await app.close();
  });
});
