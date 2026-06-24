import { randomUUID } from "node:crypto";

import type { PropertyCreateResponse, PublicPropertyDetailResponse } from "@propai/shared";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";
import { subscribeTenantEvents } from "./modules/realtime/bus.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

type PublicListResponse = {
  properties: { id: string; status: string }[];
  nextCursor: string | null;
};

async function signUpOwner(app: Awaited<ReturnType<typeof buildApp>>) {
  const suffix = randomUUID().slice(0, 8);
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    payload: {
      email: `mkt-owner-${suffix}@test.propai-os.local`,
      password: "password123",
      name: "Marketplace Owner",
      organizationName: `Marketplace Brokerage ${suffix}`,
    },
  });
  expect(res.statusCode).toBe(201);
  const body = res.json() as BrokerageSignUpResponse;
  const cookie = normalizeCookieHeader(res.headers["set-cookie"]) ?? "";
  return { tenantId: body.organization.id, cookie, suffix };
}

async function createActiveProperty(
  app: Awaited<ReturnType<typeof buildApp>>,
  cookie: string,
  title: string,
) {
  const res = await app.inject({
    method: "POST",
    url: "/v1/properties",
    headers: { cookie, "content-type": "application/json" },
    payload: {
      title,
      type: "single_family",
      status: "active",
      priceUsdCents: 45_000_000,
      rentOrSale: "sale",
      bedrooms: 3,
      bathrooms: "2",
      sqFt: 1800,
      addressLine1: "100 Congress Ave",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      latitude: 30.2672,
      longitude: -97.7431,
    },
  });
  expect(res.statusCode).toBe(201);
  return (res.json() as PropertyCreateResponse).property;
}

describe("Phase 5 — public marketplace integration", () => {
  it("lists active properties with an X-Cache header and serves detail with images/features arrays", async () => {
    const app = await buildApp();
    const { tenantId, cookie } = await signUpOwner(app);
    const property = await createActiveProperty(app, cookie, "Sunny Bungalow");

    // First list request is a cache MISS (or BYPASS without Redis).
    const firstList = await app.inject({
      method: "GET",
      url: `/public/properties?tenantId=${tenantId}`,
    });
    expect(firstList.statusCode).toBe(200);
    const listBody = firstList.json() as PublicListResponse;
    expect(listBody.properties.some((p) => p.id === property.id)).toBe(true);
    expect(["HIT", "MISS", "BYPASS"]).toContain(firstList.headers["x-cache"]);

    // Detail returns property + images + features arrays.
    const detail = await app.inject({
      method: "GET",
      url: `/public/properties/${property.id}`,
    });
    expect(detail.statusCode).toBe(200);
    const detailBody = detail.json() as PublicPropertyDetailResponse;
    expect(detailBody.property.id).toBe(property.id);
    expect(Array.isArray(detailBody.images)).toBe(true);
    expect(Array.isArray(detailBody.features)).toBe(true);

    // Unknown id → 404.
    const missing = await app.inject({
      method: "GET",
      url: `/public/properties/${randomUUID()}`,
    });
    expect(missing.statusCode).toBe(404);

    await app.close();
  });

  it("POST /public/leads creates a lead and publishes lead:created", async () => {
    const app = await buildApp();
    const { tenantId, cookie, suffix } = await signUpOwner(app);
    const property = await createActiveProperty(app, cookie, "Lakeside Condo");

    const events: string[] = [];
    const unsubscribe = subscribeTenantEvents(tenantId, (event) => {
      events.push(event.type);
    });

    const lead = await app.inject({
      method: "POST",
      url: "/public/leads",
      headers: { "content-type": "application/json" },
      payload: {
        tenantId,
        propertyId: property.id,
        firstName: "Avery",
        lastName: "Buyer",
        email: `avery-${suffix}@example.com`,
        message: "Is this still available?",
      },
    });

    expect(lead.statusCode).toBe(201);
    expect((lead.json() as { leadId: string }).leadId).toBeDefined();
    expect(events).toContain("lead:created");

    unsubscribe();
    await app.close();
  });

  it("silently drops honeypot submissions without creating a lead", async () => {
    const app = await buildApp();
    const { tenantId, suffix } = await signUpOwner(app);

    const events: string[] = [];
    const unsubscribe = subscribeTenantEvents(tenantId, (event) => {
      events.push(event.type);
    });

    const res = await app.inject({
      method: "POST",
      url: "/public/leads",
      headers: { "content-type": "application/json" },
      payload: {
        tenantId,
        firstName: "Sneaky",
        lastName: "Bot",
        email: `bot-${suffix}@example.com`,
        website: "http://spam.example", // honeypot filled
      },
    });

    // Returns 201 (no signal to the bot) but creates nothing / emits no event.
    expect(res.statusCode).toBe(201);
    expect(events).not.toContain("lead:created");

    unsubscribe();
    await app.close();
  });
});
