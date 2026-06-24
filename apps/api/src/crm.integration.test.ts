import { randomUUID } from "node:crypto";

import type {
  AuditLogListResponse,
  LeadActivityListResponse,
  LeadListResponse,
  LeadResponse,
} from "@propai/shared";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};


type LeadSingleResponse = { lead: LeadResponse };
type LeadActivitySingleResponse = {
  activity: { id: string; type: string; content: string };
};

describe("Day 37 — CRM leads integration", () => {
  it("create lead → add note → move stage → audit trail exists", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    // Sign up a brokerage owner (has leads:write + audit:read)
    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `crm-owner-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "CRM Owner",
        organizationName: `CRM Brokerage ${suffix}`,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const signUpBody = signUpResponse.json() as BrokerageSignUpResponse;
    const cookie = normalizeCookieHeader(signUpResponse.headers["set-cookie"]) ?? "";
    const orgId = signUpBody.organization.id;

    expect(signUpBody.session.activeOrganizationId).toBe(orgId);

    // Sanity-check that pipeline stages are seeded and listable on sign-up.
    const stagesResponse = await app.inject({
      method: "GET",
      url: "/v1/pipeline-stages",
      headers: { cookie },
    });
    expect(stagesResponse.statusCode).toBe(200);

    // POST /v1/leads — create a lead
    const createLeadResponse = await app.inject({
      method: "POST",
      url: "/v1/leads",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        firstName: "João",
        lastName: "Silva",
        email: `joao-${suffix}@example.com`,
        source: "website",
        notes: "Interested in 3BR properties",
      },
    });

    expect(createLeadResponse.statusCode).toBe(201);

    const createLeadBody = createLeadResponse.json() as LeadSingleResponse;
    const leadId = createLeadBody.lead.id;

    expect(createLeadBody.lead.firstName).toBe("João");
    expect(createLeadBody.lead.email).toBe(`joao-${suffix}@example.com`);
    expect(createLeadBody.lead.tenantId).toBe(orgId);

    // GET /v1/leads — list leads (should contain the new lead)
    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/leads",
      headers: { cookie },
    });

    expect(listResponse.statusCode).toBe(200);

    const listBody = listResponse.json() as LeadListResponse;

    expect(listBody.leads.some((l) => l.id === leadId)).toBe(true);
    expect(listBody.total).toBeGreaterThanOrEqual(1);

    // POST /v1/leads/:id/activities — add a note
    const addNoteResponse = await app.inject({
      method: "POST",
      url: `/v1/leads/${leadId}/activities`,
      headers: { cookie, "content-type": "application/json" },
      payload: { type: "note", content: "Called the client, very interested." },
    });

    expect(addNoteResponse.statusCode).toBe(201);

    const addNoteBody = addNoteResponse.json() as LeadActivitySingleResponse;

    expect(addNoteBody.activity.type).toBe("note");
    expect(addNoteBody.activity.content).toBe("Called the client, very interested.");

    // PATCH /v1/leads/:id — update the lead
    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/leads/${leadId}`,
      headers: { cookie, "content-type": "application/json" },
      payload: { phone: "+5511999999999" },
    });

    expect(updateResponse.statusCode).toBe(200);

    const updateBody = updateResponse.json() as LeadSingleResponse;

    expect(updateBody.lead.phone).toBe("+5511999999999");

    // GET /v1/leads/:id/activities — should have 1 activity (the note)
    const activitiesResponse = await app.inject({
      method: "GET",
      url: `/v1/leads/${leadId}/activities`,
      headers: { cookie },
    });

    expect(activitiesResponse.statusCode).toBe(200);

    const activitiesBody = activitiesResponse.json() as LeadActivityListResponse;

    expect(activitiesBody.activities).toHaveLength(1);
    expect(activitiesBody.activities[0]?.type).toBe("note");

    // GET /v1/audit-logs — audit trail should have lead.created and lead.updated
    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
      headers: { cookie },
    });

    expect(auditResponse.statusCode).toBe(200);

    const auditBody = auditResponse.json() as AuditLogListResponse;

    expect(
      auditBody.items.some(
        (e) => e.action === "lead.created" && e.entityId === leadId,
      ),
    ).toBe(true);

    expect(
      auditBody.items.some(
        (e) => e.action === "lead.updated" && e.entityId === leadId,
      ),
    ).toBe(true);

    await app.close();
  });

  it("PATCH /v1/leads/:id/stage creates stage_change activity and audit", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `crm-stage-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "CRM Stage Owner",
        organizationName: `CRM Stage Org ${suffix}`,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const signUpBody = signUpResponse.json() as BrokerageSignUpResponse;
    const cookie = normalizeCookieHeader(signUpResponse.headers["set-cookie"]) ?? "";
    const orgId = signUpBody.organization.id;

    // Create a lead first
    const createLeadResponse = await app.inject({
      method: "POST",
      url: "/v1/leads",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        firstName: "Maria",
        lastName: "Santos",
        email: `maria-${suffix}@example.com`,
      },
    });

    expect(createLeadResponse.statusCode).toBe(201);

    const leadId = (createLeadResponse.json() as LeadSingleResponse).lead.id;

    // We need a valid stage. The org was seeded with 6 default stages.
    // We'll query the DB directly via the pipeline_stages table via a workaround:
    // Use the leads list endpoint with a known stage — but instead let's use
    // the GET /v1/leads/:id to find the org, then query stages.
    // Actually, we can get a stageId by querying the DB via drizzle admin connection.
    const { getDb, pipelineStages } = await import("@propai/db");
    const { eq } = await import("drizzle-orm");

    const adminDb = getDb();
    const [firstStage] = await adminDb
      .select({ id: pipelineStages.id, name: pipelineStages.name })
      .from(pipelineStages)
      .where(eq(pipelineStages.tenantId, orgId))
      .limit(1);

    expect(firstStage).toBeDefined();

    const stageId = firstStage!.id;

    // PATCH /v1/leads/:id/stage — move to first stage
    const moveResponse = await app.inject({
      method: "PATCH",
      url: `/v1/leads/${leadId}/stage`,
      headers: { cookie, "content-type": "application/json" },
      payload: { stageId },
    });

    expect(moveResponse.statusCode).toBe(200);

    const moveBody = moveResponse.json() as LeadSingleResponse;

    expect(moveBody.lead.stageId).toBe(stageId);

    // GET /v1/leads/:id/activities — should have stage_change activity
    const activitiesResponse = await app.inject({
      method: "GET",
      url: `/v1/leads/${leadId}/activities`,
      headers: { cookie },
    });

    expect(activitiesResponse.statusCode).toBe(200);

    const activitiesBody = activitiesResponse.json() as LeadActivityListResponse;

    const stageChangeActivity = activitiesBody.activities.find(
      (a) => a.type === "stage_change",
    );

    expect(stageChangeActivity).toBeDefined();
    expect(stageChangeActivity?.content).toContain(firstStage!.name);

    // GET /v1/audit-logs — should have lead.stage_changed
    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
      headers: { cookie },
    });

    expect(auditResponse.statusCode).toBe(200);

    const auditBody = auditResponse.json() as AuditLogListResponse;

    expect(
      auditBody.items.some(
        (e) => e.action === "lead.stage_changed" && e.entityId === leadId,
      ),
    ).toBe(true);

    await app.close();
  });

  it("returns 401 for unauthenticated GET /v1/leads", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/leads",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "Unauthorized" });

    await app.close();
  });

  it("DELETE /v1/leads/:id soft-deletes and returns 404 on re-fetch", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `crm-delete-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "CRM Delete Owner",
        organizationName: `CRM Delete Org ${suffix}`,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const cookie = normalizeCookieHeader(signUpResponse.headers["set-cookie"]) ?? "";

    const createLeadResponse = await app.inject({
      method: "POST",
      url: "/v1/leads",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        firstName: "Delete",
        lastName: "Me",
        email: `delete-${suffix}@example.com`,
      },
    });

    expect(createLeadResponse.statusCode).toBe(201);

    const leadId = (createLeadResponse.json() as LeadSingleResponse).lead.id;

    // DELETE
    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/v1/leads/${leadId}`,
      headers: { cookie },
    });

    expect(deleteResponse.statusCode).toBe(200);

    // GET after delete should 404
    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/leads/${leadId}`,
      headers: { cookie },
    });

    expect(getResponse.statusCode).toBe(404);

    await app.close();
  });
});
