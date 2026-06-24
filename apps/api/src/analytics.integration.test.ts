import { randomUUID } from "node:crypto";

import type { AnalyticsFunnelResponse, AnalyticsOverview } from "@propai/shared";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type SignUp = {
  organization: { id: string };
};

async function setup(app: Awaited<ReturnType<typeof buildApp>>) {
  const suffix = randomUUID().slice(0, 8);
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    payload: {
      email: `analytics-${suffix}@test.propai-os.local`,
      password: "password123",
      name: "Analytics Owner",
      organizationName: `Analytics Brokerage ${suffix}`,
    },
  });
  expect(res.statusCode).toBe(201);
  const tenantId = (res.json() as SignUp).organization.id;
  const cookie = normalizeCookieHeader(res.headers["set-cookie"]) ?? "";
  return { tenantId, cookie, suffix };
}

describe("Phase 6 — analytics integration", () => {
  it("returns overview KPIs, a funnel, agents, and views for the owner", async () => {
    const app = await buildApp();
    const { cookie, suffix } = await setup(app);

    // Create an active property + a lead so the aggregates are non-trivial.
    await app.inject({
      method: "POST",
      url: "/v1/properties",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        title: "Analytics Home",
        type: "single_family",
        status: "active",
        priceUsdCents: 40_000_000,
        rentOrSale: "sale",
        bedrooms: 3,
        bathrooms: "2",
        sqFt: 1800,
        addressLine1: "1 Data Dr",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
      },
    });

    await app.inject({
      method: "POST",
      url: "/v1/leads",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        firstName: "Lead",
        lastName: "One",
        email: `lead-${suffix}@example.com`,
      },
    });

    const overviewRes = await app.inject({
      method: "GET",
      url: "/v1/analytics/overview?range=30d",
      headers: { cookie },
    });
    expect(overviewRes.statusCode).toBe(200);
    const overview = overviewRes.json() as AnalyticsOverview;
    expect(overview.activeListings).toBeGreaterThanOrEqual(1);
    expect(overview.totalLeads).toBeGreaterThanOrEqual(1);
    expect(overview.range).toBe("30d");

    const funnelRes = await app.inject({
      method: "GET",
      url: "/v1/analytics/funnel",
      headers: { cookie },
    });
    expect(funnelRes.statusCode).toBe(200);
    const funnel = funnelRes.json() as AnalyticsFunnelResponse;
    // Default pipeline seeds 6 stages.
    expect(funnel.stages.length).toBe(6);

    const agentsRes = await app.inject({
      method: "GET",
      url: "/v1/analytics/agents",
      headers: { cookie },
    });
    expect(agentsRes.statusCode).toBe(200);

    const viewsRes = await app.inject({
      method: "GET",
      url: "/v1/analytics/views?range=7d",
      headers: { cookie },
    });
    expect(viewsRes.statusCode).toBe(200);
    expect((viewsRes.json() as { points: unknown[] }).points.length).toBe(7);

    await app.close();
  });

  it("exports leads and properties as CSV", async () => {
    const app = await buildApp();
    const { cookie, suffix } = await setup(app);

    await app.inject({
      method: "POST",
      url: "/v1/leads",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        firstName: "Csv",
        lastName: "Lead",
        email: `csv-${suffix}@example.com`,
      },
    });

    const leadsCsv = await app.inject({
      method: "GET",
      url: "/v1/analytics/export/leads?format=csv",
      headers: { cookie },
    });
    expect(leadsCsv.statusCode).toBe(200);
    expect(leadsCsv.headers["content-type"]).toContain("text/csv");
    expect(leadsCsv.headers["content-disposition"]).toContain("leads.csv");
    expect(leadsCsv.body).toContain("First Name");
    expect(leadsCsv.body).toContain("Csv");

    const propsCsv = await app.inject({
      method: "GET",
      url: "/v1/analytics/export/properties?format=csv",
      headers: { cookie },
    });
    expect(propsCsv.statusCode).toBe(200);
    expect(propsCsv.headers["content-type"]).toContain("text/csv");
    expect(propsCsv.body).toContain("Title");

    await app.close();
  });
});
