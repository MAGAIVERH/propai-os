import { randomUUID } from "node:crypto";

import type { AuditLogListResponse } from "@propai/shared";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { clearDevInvitations } from "./lib/invitation-dev-store.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

type InvitationCreateResponse = {
  invitation: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
};

describe("Day 13 — audit log integration", () => {
  it("owner lists organization.created after brokerage sign-up", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const organizationName = `Audit Day13 ${suffix}`;

    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `audit-owner-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "Audit Owner",
        organizationName,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const signUpBody = signUpResponse.json() as BrokerageSignUpResponse;
    const ownerCookie = normalizeCookieHeader(signUpResponse.headers["set-cookie"]);

    expect(ownerCookie).toBeDefined();
    expect(signUpBody.session.activeOrganizationId).toBe(
      signUpBody.organization.id,
    );

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
      headers: { cookie: ownerCookie ?? "" },
    });

    expect(auditResponse.statusCode).toBe(200);

    const auditBody = auditResponse.json() as AuditLogListResponse;

    expect(
      auditBody.items.some(
        (entry) =>
          entry.action === "organization.created" &&
          entry.entityType === "organization" &&
          entry.entityId === signUpBody.organization.id &&
          entry.tenantId === signUpBody.organization.id &&
          entry.actorId === signUpBody.user.id,
      ),
    ).toBe(true);

    await app.close();
  });

  it("agent invited to org receives 403 on GET /v1/audit-logs", async () => {
    const app = await buildApp();
    clearDevInvitations();
    const suffix = randomUUID().slice(0, 8);
    const agentEmail = `audit-agent-${suffix}@test.propai-os.local`;

    const ownerSignUp = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `audit-owner-invite-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "Audit Owner Invite",
        organizationName: `Audit Invite Org ${suffix}`,
      },
    });

    expect(ownerSignUp.statusCode).toBe(201);

    const ownerBody = ownerSignUp.json() as BrokerageSignUpResponse;
    const ownerCookie = normalizeCookieHeader(ownerSignUp.headers["set-cookie"]);

    expect(ownerCookie).toBeDefined();

    const inviteResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-invite",
      headers: {
        cookie: ownerCookie ?? "",
        "content-type": "application/json",
      },
      payload: {
        email: agentEmail,
        role: "agent",
      },
    });

    expect(inviteResponse.statusCode).toBe(201);

    const inviteBody = inviteResponse.json() as InvitationCreateResponse;

    const agentSignUp = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      payload: {
        email: agentEmail,
        password: "password123",
        name: "Audit Agent",
      },
    });

    expect(agentSignUp.statusCode).toBe(200);

    const agentCookie = normalizeCookieHeader(agentSignUp.headers["set-cookie"]);

    expect(agentCookie).toBeDefined();

    const acceptResponse = await app.inject({
      method: "POST",
      url: "/api/auth/organization/accept-invitation",
      headers: {
        cookie: agentCookie ?? "",
        "content-type": "application/json",
      },
      payload: { invitationId: inviteBody.invitation.id },
    });

    expect(acceptResponse.statusCode).toBe(200);

    const agentSessionCookie =
      normalizeCookieHeader(acceptResponse.headers["set-cookie"]) ?? agentCookie;

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
      headers: { cookie: agentSessionCookie ?? "" },
    });

    expect(auditResponse.statusCode).toBe(403);
    expect(auditResponse.json()).toMatchObject({
      error: "Forbidden",
      message: "Insufficient permissions for this action.",
    });

    expect(ownerBody.organization.id).toBe(inviteBody.invitation.organizationId);

    await app.close();
  });

  it("manager invited to org can list audit logs", async () => {
    const app = await buildApp();
    clearDevInvitations();
    const suffix = randomUUID().slice(0, 8);
    const managerEmail = `audit-manager-${suffix}@test.propai-os.local`;

    const ownerSignUp = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `audit-owner-mgr-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "Audit Owner Manager",
        organizationName: `Audit Manager Org ${suffix}`,
      },
    });

    expect(ownerSignUp.statusCode).toBe(201);

    const ownerCookie = normalizeCookieHeader(ownerSignUp.headers["set-cookie"]);

    expect(ownerCookie).toBeDefined();

    const inviteResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-invite",
      headers: {
        cookie: ownerCookie ?? "",
        "content-type": "application/json",
      },
      payload: {
        email: managerEmail,
        role: "manager",
      },
    });

    expect(inviteResponse.statusCode).toBe(201);

    const inviteBody = inviteResponse.json() as InvitationCreateResponse;

    const managerSignUp = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      payload: {
        email: managerEmail,
        password: "password123",
        name: "Audit Manager",
      },
    });

    expect(managerSignUp.statusCode).toBe(200);

    const managerCookie = normalizeCookieHeader(
      managerSignUp.headers["set-cookie"],
    );

    const acceptResponse = await app.inject({
      method: "POST",
      url: "/api/auth/organization/accept-invitation",
      headers: {
        cookie: managerCookie ?? "",
        "content-type": "application/json",
      },
      payload: { invitationId: inviteBody.invitation.id },
    });

    expect(acceptResponse.statusCode).toBe(200);

    const managerSessionCookie =
      normalizeCookieHeader(acceptResponse.headers["set-cookie"]) ??
      managerCookie;

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
      headers: { cookie: managerSessionCookie ?? "" },
    });

    expect(auditResponse.statusCode).toBe(200);

    const auditBody = auditResponse.json() as AuditLogListResponse;

    expect(
      auditBody.items.some((entry) => entry.action === "organization.created"),
    ).toBe(true);

    await app.close();
  });

  it("returns 401 for unauthenticated GET /v1/audit-logs", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "Unauthorized" });

    await app.close();
  });
});
