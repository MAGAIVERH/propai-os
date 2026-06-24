import { getMemberRoleForOrganization, TenantContextRequiredError } from "@propai/db";
import {
  onboardingStatusSchema,
  teamListResponseSchema,
  tenantSettingsResponseSchema,
  updateMemberRoleSchema,
  updateTenantSettingsSchema,
} from "@propai/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { apiError } from "../../lib/api-error.js";
import { writeAuditEventSafe } from "../../lib/write-audit-event.js";
import {
  getOnboardingStatus,
  getTenantSettings,
  listTeam,
  markOnboardingComplete,
  removeMember,
  updateMemberRole,
  updateTenantSettings,
} from "./queries/settings-queries.js";

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }
  return request.tenantId;
}

/** Owner-only guard for team/branding mutations. */
async function requireOwner(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const tenantId = request.tenantId;
  const userId = request.session?.user.id;
  if (!tenantId || !userId) {
    reply.status(401).send(apiError("Unauthorized", "Authentication required."));
    return false;
  }
  const role = await getMemberRoleForOrganization(userId, tenantId);
  if (role !== "owner") {
    reply.status(403).send(apiError("Forbidden", "Only the organization owner can do this."));
    return false;
  }
  return true;
}

export async function registerSettingsRoutes(app: FastifyInstance): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();

  // ── Team (Day 63) ───────────────────────────────────────────────────────────
  zodApp.get(
    "/team",
    { schema: { response: { 200: teamListResponseSchema } } },
    async (request, reply: FastifyReply) => {
      const members = await listTeam(requireTenantId(request));
      return reply.status(200).send({ members });
    },
  );

  zodApp.patch(
    "/team/members/:memberId/role",
    {
      schema: {
        params: z.object({ memberId: z.string().min(1) }),
        body: updateMemberRoleSchema,
      },
    },
    async (request, reply: FastifyReply) => {
      if (!(await requireOwner(request, reply))) return;
      const tenantId = requireTenantId(request);
      const { memberId } = z.object({ memberId: z.string().min(1) }).parse(request.params);
      const { role } = updateMemberRoleSchema.parse(request.body);

      const ok = await updateMemberRole(tenantId, memberId, role);
      if (!ok) {
        return reply.status(404).send(apiError("Not Found", "Member not found."));
      }
      await writeAuditEventSafe({
        tenantId,
        actorId: request.session?.user.id ?? null,
        action: "member.role_changed",
        entityType: "member",
        entityId: memberId,
        metadata: { role },
        ip: request.ip,
      });
      return reply.status(200).send({ ok: true });
    },
  );

  zodApp.delete(
    "/team/members/:memberId",
    { schema: { params: z.object({ memberId: z.string().min(1) }) } },
    async (request, reply: FastifyReply) => {
      if (!(await requireOwner(request, reply))) return;
      const tenantId = requireTenantId(request);
      const { memberId } = z.object({ memberId: z.string().min(1) }).parse(request.params);

      const result = await removeMember(tenantId, memberId);
      if (result.wasOwner) {
        return reply.status(400).send(apiError("Bad Request", "The owner cannot be removed."));
      }
      if (!result.removed) {
        return reply.status(404).send(apiError("Not Found", "Member not found."));
      }
      await writeAuditEventSafe({
        tenantId,
        actorId: request.session?.user.id ?? null,
        action: "member.removed",
        entityType: "member",
        entityId: memberId,
        metadata: {},
        ip: request.ip,
      });
      return reply.status(200).send({ ok: true });
    },
  );

  // ── Tenant settings + branding (Day 64) ──────────────────────────────────────
  zodApp.get(
    "/settings",
    { schema: { response: { 200: tenantSettingsResponseSchema } } },
    async (request, reply: FastifyReply) => {
      const settings = await getTenantSettings(requireTenantId(request));
      if (!settings) {
        return reply.status(404).send(apiError("Not Found", "Settings not found."));
      }
      return reply.status(200).send(settings);
    },
  );

  zodApp.patch(
    "/settings",
    { schema: { body: updateTenantSettingsSchema } },
    async (request, reply: FastifyReply) => {
      if (!(await requireOwner(request, reply))) return;
      const tenantId = requireTenantId(request);
      const input = updateTenantSettingsSchema.parse(request.body);

      const result = await updateTenantSettings(tenantId, input);
      if (result && "taken" in result) {
        return reply
          .status(409)
          .send(apiError("Conflict", "That marketplace slug is already taken."));
      }
      if (!result) {
        return reply.status(404).send(apiError("Not Found", "Settings not found."));
      }
      await writeAuditEventSafe({
        tenantId,
        actorId: request.session?.user.id ?? null,
        action: "settings.updated",
        entityType: "organization",
        entityId: tenantId,
        metadata: { fields: Object.keys(input) },
        ip: request.ip,
      });
      return reply.status(200).send(result);
    },
  );

  // ── Onboarding (Day 62) ──────────────────────────────────────────────────────
  zodApp.get(
    "/onboarding",
    { schema: { response: { 200: onboardingStatusSchema } } },
    async (request, reply: FastifyReply) => {
      const status = await getOnboardingStatus(requireTenantId(request));
      return reply.status(200).send(status);
    },
  );

  zodApp.post("/onboarding/complete", async (request, reply: FastifyReply) => {
    const tenantId = requireTenantId(request);
    await markOnboardingComplete(tenantId);
    const status = await getOnboardingStatus(tenantId);
    return reply.status(200).send(status);
  });
}
