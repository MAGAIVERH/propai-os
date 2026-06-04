import { randomUUID } from "node:crypto";

import {
  auditLogs,
  closeDb,
  getDb,
  logAuditEvent,
  member,
  organization,
  user,
  withTenantContext,
} from "@propai/db";
import type { AuditLogListResponse } from "@propai/shared";
import { eq } from "drizzle-orm";
import { describe, expect, it, beforeAll, afterAll } from "vitest";

import { buildApp } from "./app.js";
import { createMockSessionAuthorization } from "./modules/auth/session.js";

const OWNER_USER_ID = "audit-test-owner";
const AGENT_USER_ID = "audit-test-agent";

type AuditSeed = {
  organizationId: string;
};

async function seedAuditRbacFixture(): Promise<AuditSeed> {
  const adminDb = getDb();

  await adminDb.delete(auditLogs);
  await adminDb.delete(member);
  await adminDb.delete(user);
  await adminDb.delete(organization);

  const [org] = await adminDb
    .insert(organization)
    .values({ name: "Audit RBAC Org", slug: "audit-rbac-org" })
    .returning();

  if (!org) {
    throw new Error("Failed to seed organization for audit tests.");
  }

  await adminDb.insert(user).values([
    {
      id: OWNER_USER_ID,
      name: "Audit Owner",
      email: "audit-owner@test.propai-os.local",
    },
    {
      id: AGENT_USER_ID,
      name: "Audit Agent",
      email: "audit-agent@test.propai-os.local",
    },
  ]);

  await adminDb.insert(member).values([
    {
      id: `member-${OWNER_USER_ID}`,
      organizationId: org.id,
      userId: OWNER_USER_ID,
      role: "owner",
    },
    {
      id: `member-${AGENT_USER_ID}`,
      organizationId: org.id,
      userId: AGENT_USER_ID,
      role: "agent",
    },
  ]);

  const auditWrite = await logAuditEvent({
    tenantId: org.id,
    actorId: OWNER_USER_ID,
    action: "organization.created",
    entityType: "organization",
    entityId: org.id,
    metadata: { slug: org.slug, organizationName: org.name },
    ip: "127.0.0.1",
  });

  if (!auditWrite.success) {
    throw new Error("Failed to seed audit log row.");
  }

  return { organizationId: org.id };
}

describe("GET /v1/audit-logs", () => {
  let seed: AuditSeed;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    seed = await seedAuditRbacFixture();
  });

  it("returns 401 without authentication", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "Unauthorized" });

    await app.close();
  });

  it("returns 403 for agent role", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
      headers: {
        authorization: createMockSessionAuthorization(
          seed.organizationId,
          AGENT_USER_ID,
        ),
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: "Forbidden",
      message: "Insufficient permissions for this action.",
    });

    await app.close();
  });

  it("returns 200 with items for owner role", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "GET",
      url: "/v1/audit-logs",
      headers: {
        authorization: createMockSessionAuthorization(
          seed.organizationId,
          OWNER_USER_ID,
        ),
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as AuditLogListResponse;

    expect(body.items.length).toBeGreaterThanOrEqual(1);
    expect(body.items[0]).toMatchObject({
      action: "organization.created",
      entityType: "organization",
      entityId: seed.organizationId,
      tenantId: seed.organizationId,
      actorId: OWNER_USER_ID,
    });

    await app.close();
  });
});

describe("Brokerage sign-up audit hook", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("writes organization.created to audit_logs", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const email = `audit-signup-${suffix}@test.propai-os.local`;
    const organizationName = `Audit Signup Brokerage ${suffix}`;

    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email,
        password: "password123",
        name: "Audit Signup Owner",
        organizationName,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const signUpBody = signUpResponse.json() as {
      organization: { id: string; slug: string };
      user: { id: string };
    };

    const rows = await withTenantContext(signUpBody.organization.id, async (tx) => {
      return tx
        .select({
          action: auditLogs.action,
          entityId: auditLogs.entityId,
          actorId: auditLogs.actorId,
        })
        .from(auditLogs)
        .where(eq(auditLogs.entityId, signUpBody.organization.id));
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: "organization.created",
      entityId: signUpBody.organization.id,
      actorId: signUpBody.user.id,
    });

    await app.close();
  });
});
