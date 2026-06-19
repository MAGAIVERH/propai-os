import { randomUUID } from "node:crypto";

import type {
  AuditLogListResponse,
  LeadActivityListResponse,
  PropertyCreateResponse,
} from "@propai/shared";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

type LeadSingleResponse = { lead: { id: string } };
type ScheduleVisitResponse = {
  activity: { id: string; type: string; content: string };
};

describe("Day 44 — schedule visit confirmation email", () => {
  it("schedule visit → visit_scheduled activity + visit.scheduled audit", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `visit-owner-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "Visit Owner",
        organizationName: `Visit Brokerage ${suffix}`,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const signUpBody = signUpResponse.json() as BrokerageSignUpResponse;
    const cookie =
      normalizeCookieHeader(signUpResponse.headers["set-cookie"]) ?? "";

    // Create a property to visit.
    const propertyResponse = await app.inject({
      method: "POST",
      url: "/v1/properties",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        title: "Austin Ranch Home",
        type: "single_family",
        priceUsdCents: 45_000_000,
        rentOrSale: "sale",
        bedrooms: 3,
        bathrooms: "2.5",
        sqFt: 2100,
        addressLine1: "123 Maple St",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
      },
    });

    expect(propertyResponse.statusCode).toBe(201);

    const propertyId = (propertyResponse.json() as PropertyCreateResponse)
      .property.id;

    // Create a lead linked to that property.
    const createLeadResponse = await app.inject({
      method: "POST",
      url: "/v1/leads",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        firstName: "Jordan",
        lastName: "Smith",
        email: `jordan-${suffix}@example.com`,
        propertyId,
      },
    });

    expect(createLeadResponse.statusCode).toBe(201);

    const leadId = (createLeadResponse.json() as LeadSingleResponse).lead.id;

    // Schedule the visit.
    const scheduleResponse = await app.inject({
      method: "POST",
      url: `/v1/leads/${leadId}/schedule-visit`,
      headers: { cookie, "content-type": "application/json" },
      payload: {
        scheduledAt: "2026-07-01T20:00:00.000Z",
        timezone: "America/Chicago",
      },
    });

    expect(scheduleResponse.statusCode).toBe(201);

    const scheduleBody = scheduleResponse.json() as ScheduleVisitResponse;

    expect(scheduleBody.activity.type).toBe("visit_scheduled");
    expect(scheduleBody.activity.content).toContain("Visit scheduled for");
    expect(scheduleBody.activity.content).toContain("CDT");

    // Activity is on the timeline.
    const activitiesResponse = await app.inject({
      method: "GET",
      url: `/v1/leads/${leadId}/activities`,
      headers: { cookie },
    });

    expect(activitiesResponse.statusCode).toBe(200);

    const activitiesBody =
      activitiesResponse.json() as LeadActivityListResponse;

    expect(
      activitiesBody.activities.some((a) => a.type === "visit_scheduled"),
    ).toBe(true);

    // Audit trail records the scheduling.
    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
      headers: { cookie },
    });

    expect(auditResponse.statusCode).toBe(200);

    const auditBody = auditResponse.json() as AuditLogListResponse;

    expect(
      auditBody.items.some(
        (e) => e.action === "visit.scheduled" && e.entityId === leadId,
      ),
    ).toBe(true);

    await app.close();
  });

  it("returns 400 when scheduling a visit without a property", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `visit-noprop-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "Visit NoProp",
        organizationName: `Visit NoProp Brokerage ${suffix}`,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const cookie =
      normalizeCookieHeader(signUpResponse.headers["set-cookie"]) ?? "";

    const createLeadResponse = await app.inject({
      method: "POST",
      url: "/v1/leads",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        firstName: "Pat",
        lastName: "Doe",
        email: `pat-${suffix}@example.com`,
      },
    });

    expect(createLeadResponse.statusCode).toBe(201);

    const leadId = (createLeadResponse.json() as LeadSingleResponse).lead.id;

    const scheduleResponse = await app.inject({
      method: "POST",
      url: `/v1/leads/${leadId}/schedule-visit`,
      headers: { cookie, "content-type": "application/json" },
      payload: {
        scheduledAt: "2026-07-01T20:00:00.000Z",
        timezone: "America/Chicago",
      },
    });

    expect(scheduleResponse.statusCode).toBe(400);

    await app.close();
  });
});
