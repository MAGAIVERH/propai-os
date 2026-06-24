import { randomUUID } from "node:crypto";

import type { BillingStatus } from "@propai/shared";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

async function signUpOwner(app: Awaited<ReturnType<typeof buildApp>>) {
  const suffix = randomUUID().slice(0, 8);
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    payload: {
      email: `billing-${suffix}@test.propai-os.local`,
      password: "password123",
      name: "Billing Owner",
      organizationName: `Billing Brokerage ${suffix}`,
    },
  });
  expect(res.statusCode).toBe(201);
  const cookie = normalizeCookieHeader(res.headers["set-cookie"]) ?? "";
  return { cookie, suffix };
}

function activeProperty(n: number) {
  return {
    title: `Listing ${n}`,
    type: "single_family" as const,
    status: "active" as const,
    priceUsdCents: 30_000_000,
    rentOrSale: "sale" as const,
    bedrooms: 3,
    bathrooms: "2",
    sqFt: 1500,
    addressLine1: `${n} Gate St`,
    city: "Austin",
    state: "TX",
    zipCode: "78701",
  };
}

describe("Phase 6 — billing + feature gate integration", () => {
  it("reports the Free plan status with usage and limits", async () => {
    const app = await buildApp();
    const { cookie } = await signUpOwner(app);

    const res = await app.inject({
      method: "GET",
      url: "/v1/billing",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const status = res.json() as BillingStatus;
    expect(status.plan).toBe("free");
    expect(status.limits.activeListings).toBe(5);
    expect(status.limits.agents).toBe(2);
    expect(status.usage.activeListings).toBe(0);
    expect(typeof status.billingEnabled).toBe("boolean");

    await app.close();
  });

  it("blocks publishing a 6th active listing on the Free plan (402)", async () => {
    const app = await buildApp();
    const { cookie } = await signUpOwner(app);

    for (let i = 1; i <= 5; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/v1/properties",
        headers: { cookie, "content-type": "application/json" },
        payload: activeProperty(i),
      });
      expect(res.statusCode).toBe(201);
    }

    const sixth = await app.inject({
      method: "POST",
      url: "/v1/properties",
      headers: { cookie, "content-type": "application/json" },
      payload: activeProperty(6),
    });
    expect(sixth.statusCode).toBe(402);

    // Creating a draft is still allowed.
    const draft = await app.inject({
      method: "POST",
      url: "/v1/properties",
      headers: { cookie, "content-type": "application/json" },
      payload: { ...activeProperty(7), status: "draft" },
    });
    expect(draft.statusCode).toBe(201);

    await app.close();
  });
});
