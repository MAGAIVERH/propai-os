import {
  leadActivities,
  leads,
  pipelineStages,
  properties,
  runInTenantContext,
  TenantContextRequiredError,
} from "@propai/db";
import {
  createLeadActivitySchema,
  createLeadSchema,
  leadActivityListResponseSchema,
  leadActivityResponseSchema,
  leadListQuerySchema,
  leadListResponseSchema,
  leadParamsSchema,
  leadResponseSchema,
  moveLeadStageSchema,
  pipelineStageListResponseSchema,
  scheduleVisitResponseSchema,
  scheduleVisitSchema,
  updateLeadSchema,
  visitListResponseSchema,
  type LeadActivityResponse,
  type LeadActivityType,
  type LeadResponse,
} from "@propai/shared";
import {
  and,
  count,
  desc,
  eq,
  isNull,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { apiError } from "../../lib/api-error.js";
import { decodeLeadCursor, encodeLeadCursor } from "../../lib/lead-cursor.js";
import { writeAuditEventSafe } from "../../lib/write-audit-event.js";
import { MOCK_SESSION_DEFAULT_USER_ID } from "../auth/session.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";
import { publishTenantEvent } from "../realtime/bus.js";
import { enqueueVisitConfirmationJobSafe } from "./enqueue-visit-confirmation.js";
import { formatVisitScheduleSummary } from "./visit-confirmation-email.js";
import {
  createNotifications,
  getTenantMemberUserIds,
} from "../notifications/create-notification.js";

// ── Row types ────────────────────────────────────────────────────────────────

type LeadRow = {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  source: string | null;
  assignedAgentId: string | null;
  propertyId: string | null;
  stageId: string | null;
  aiScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  softDeletedAt: Date | null;
};

type LeadActivityRow = {
  id: string;
  leadId: string;
  type: LeadActivityType;
  content: string;
  createdBy: string | null;
  createdAt: Date;
};

// ── Field selectors ──────────────────────────────────────────────────────────

const leadSelectFields = {
  id: leads.id,
  tenantId: leads.tenantId,
  firstName: leads.firstName,
  lastName: leads.lastName,
  email: leads.email,
  phone: leads.phone,
  source: leads.source,
  assignedAgentId: leads.assignedAgentId,
  propertyId: leads.propertyId,
  stageId: leads.stageId,
  aiScore: leads.aiScore,
  notes: leads.notes,
  createdAt: leads.createdAt,
  updatedAt: leads.updatedAt,
  softDeletedAt: leads.softDeletedAt,
} as const;

const activitySelectFields = {
  id: leadActivities.id,
  leadId: leadActivities.leadId,
  type: leadActivities.type,
  content: leadActivities.content,
  createdBy: leadActivities.createdBy,
  createdAt: leadActivities.createdAt,
} as const;

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapLeadRow(row: LeadRow): LeadResponse {
  return {
    id: row.id,
    tenantId: row.tenantId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    source: row.source,
    assignedAgentId: row.assignedAgentId,
    propertyId: row.propertyId,
    stageId: row.stageId,
    aiScore: row.aiScore,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapActivityRow(row: LeadActivityRow): LeadActivityResponse {
  return {
    id: row.id,
    leadId: row.leadId,
    type: row.type,
    content: row.content,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  return request.tenantId;
}

function requireSessionUserId(request: FastifyRequest): string {
  const userId = request.session?.user.id;

  if (!userId) {
    throw new TenantContextRequiredError();
  }

  return userId;
}

function resolveActorId(request: FastifyRequest): string | null {
  const sessionUserId = request.session?.user.id ?? null;

  if (
    process.env.NODE_ENV === "test" &&
    sessionUserId === MOCK_SESSION_DEFAULT_USER_ID
  ) {
    return null;
  }

  return sessionUserId;
}

function buildLeadListFilters(
  query: { stageId?: string; assignedAgentId?: string },
  cursor: ReturnType<typeof decodeLeadCursor>,
): SQL | undefined {
  const conditions: SQL[] = [isNull(leads.softDeletedAt)];

  if (query.stageId) {
    conditions.push(eq(leads.stageId, query.stageId));
  }

  if (query.assignedAgentId) {
    conditions.push(eq(leads.assignedAgentId, query.assignedAgentId));
  }

  if (cursor) {
    conditions.push(
      or(
        lt(leads.createdAt, cursor.createdAt),
        and(
          eq(leads.createdAt, cursor.createdAt),
          lt(leads.id, cursor.id),
        ),
      )!,
    );
  }

  return and(...conditions);
}

// ── Route response schemas ───────────────────────────────────────────────────

const leadSingleResponseSchema = z.object({ lead: leadResponseSchema });
const leadActivitySingleResponseSchema = z.object({
  activity: leadActivityResponseSchema,
});

// ── Routes ───────────────────────────────────────────────────────────────────

export async function registerCrmRoutes(
  app: FastifyInstance,
): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requireLeadsWrite = createRequirePermissionHook("leads:write");

  // GET /pipeline-stages
  zodApp.get(
    "/pipeline-stages",
    {
      schema: {
        response: { 200: pipelineStageListResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select({
            id: pipelineStages.id,
            tenantId: pipelineStages.tenantId,
            name: pipelineStages.name,
            sortOrder: pipelineStages.sortOrder,
            color: pipelineStages.color,
            isWon: pipelineStages.isWon,
            isLost: pipelineStages.isLost,
            createdAt: pipelineStages.createdAt,
          })
          .from(pipelineStages)
          .orderBy(pipelineStages.sortOrder);
      });

      return reply.status(200).send({
        stages: rows.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        })),
      });
    },
  );

  // GET /visits — scheduled showings, derived from visit_scheduled activities.
  zodApp.get(
    "/visits",
    {
      schema: { response: { 200: visitListResponseSchema } },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select({
            id: leadActivities.id,
            leadId: leads.id,
            firstName: leads.firstName,
            lastName: leads.lastName,
            propertyId: properties.id,
            propertyTitle: properties.title,
            agentId: leads.assignedAgentId,
            content: leadActivities.content,
            createdAt: leadActivities.createdAt,
          })
          .from(leadActivities)
          .innerJoin(leads, eq(leads.id, leadActivities.leadId))
          .leftJoin(properties, eq(properties.id, leads.propertyId))
          .where(and(eq(leadActivities.type, "visit_scheduled"), isNull(leads.softDeletedAt)))
          .orderBy(desc(leadActivities.createdAt))
          .limit(100);
      });

      return reply.status(200).send({
        visits: rows.map((r) => ({
          id: r.id,
          leadId: r.leadId,
          leadName: `${r.firstName} ${r.lastName}`,
          propertyId: r.propertyId ?? null,
          propertyTitle: r.propertyTitle ?? null,
          agentId: r.agentId ?? null,
          content: r.content,
          createdAt: r.createdAt.toISOString(),
        })),
      });
    },
  );

  // GET /leads
  zodApp.get(
    "/leads",
    {
      schema: {
        querystring: leadListQuerySchema,
        response: { 200: leadListResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const query = leadListQuerySchema.parse(request.query);
      const { limit, cursor } = query;
      const decodedCursor = cursor ? decodeLeadCursor(cursor) : null;

      if (cursor && !decodedCursor) {
        return reply
          .status(400)
          .send(apiError("Bad Request", "Invalid pagination cursor."));
      }

      const [countRow, rows] = await runInTenantContext(
        tenantId,
        async (tx) => {
          const [cr] = await tx
            .select({ total: count() })
            .from(leads)
            .where(buildLeadListFilters(query, null));

          const dataRows = await tx
            .select(leadSelectFields)
            .from(leads)
            .where(buildLeadListFilters(query, decodedCursor))
            .orderBy(desc(leads.createdAt), desc(leads.id))
            .limit(limit + 1);

          return [cr!, dataRows] as const;
        },
      );

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const lastRow = pageRows.at(-1);
      const nextCursor =
        hasMore && lastRow
          ? encodeLeadCursor({ createdAt: lastRow.createdAt, id: lastRow.id })
          : null;

      return reply.status(200).send({
        leads: pageRows.map((r) => mapLeadRow(r as LeadRow)),
        nextCursor,
        total: countRow?.total ?? 0,
      });
    },
  );

  // POST /leads
  zodApp.post(
    "/leads",
    {
      schema: {
        body: createLeadSchema,
        response: { 201: leadSingleResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const body = createLeadSchema.parse(request.body);

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .insert(leads)
          .values({
            tenantId,
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            phone: body.phone ?? null,
            source: body.source ?? null,
            assignedAgentId: body.assignedAgentId ?? null,
            propertyId: body.propertyId ?? null,
            stageId: body.stageId ?? null,
            notes: body.notes ?? null,
          })
          .returning(leadSelectFields);
      });

      const created = rows[0];

      if (!created) {
        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Failed to create lead."));
      }

      await writeAuditEventSafe({
        tenantId,
        actorId: resolveActorId(request),
        action: "lead.created",
        entityType: "lead",
        entityId: created.id,
        metadata: {
          firstName: created.firstName,
          lastName: created.lastName,
          email: created.email,
        },
        ip: request.ip,
      });

      const lead = mapLeadRow(created as LeadRow);

      publishTenantEvent(tenantId, {
        type: "lead:created",
        tenantId,
        timestamp: new Date().toISOString(),
        lead,
      });

      const newLeadRecipients = created.assignedAgentId
        ? [created.assignedAgentId]
        : await getTenantMemberUserIds(tenantId);

      await createNotifications({
        tenantId,
        userIds: newLeadRecipients,
        type: "lead_created",
        title: "New lead",
        body: `${created.firstName} ${created.lastName} was added to the pipeline.`,
        leadId: created.id,
        excludeUserId: resolveActorId(request),
      });

      return reply.status(201).send({ lead });
    },
  );

  // GET /leads/:id
  zodApp.get(
    "/leads/:id",
    {
      schema: {
        params: leadParamsSchema,
        response: { 200: leadSingleResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = leadParamsSchema.parse(request.params);

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select(leadSelectFields)
          .from(leads)
          .where(and(eq(leads.id, id), isNull(leads.softDeletedAt)))
          .limit(1);
      });

      const row = rows[0];

      if (!row) {
        return reply
          .status(404)
          .send(apiError("Not Found", "Lead not found."));
      }

      return reply.status(200).send({ lead: mapLeadRow(row as LeadRow) });
    },
  );

  // PATCH /leads/:id
  zodApp.patch(
    "/leads/:id",
    {
      schema: {
        params: leadParamsSchema,
        body: updateLeadSchema,
        response: { 200: leadSingleResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = leadParamsSchema.parse(request.params);
      const body = updateLeadSchema.parse(request.body);

      const existingRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select(leadSelectFields)
          .from(leads)
          .where(and(eq(leads.id, id), isNull(leads.softDeletedAt)))
          .limit(1);
      });

      if (!existingRows[0]) {
        return reply
          .status(404)
          .send(apiError("Not Found", "Lead not found."));
      }

      const updateSet: Record<string, unknown> = { updatedAt: new Date() };

      if (body.firstName !== undefined) updateSet.firstName = body.firstName;
      if (body.lastName !== undefined) updateSet.lastName = body.lastName;
      if (body.email !== undefined) updateSet.email = body.email;
      if (body.phone !== undefined) updateSet.phone = body.phone;
      if (body.source !== undefined) updateSet.source = body.source;
      if (body.assignedAgentId !== undefined)
        updateSet.assignedAgentId = body.assignedAgentId;
      if (body.propertyId !== undefined) updateSet.propertyId = body.propertyId;
      if (body.stageId !== undefined) updateSet.stageId = body.stageId;
      if (body.notes !== undefined) updateSet.notes = body.notes;

      const updatedRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .update(leads)
          .set(updateSet)
          .where(eq(leads.id, id))
          .returning(leadSelectFields);
      });

      const updated = updatedRows[0];

      if (!updated) {
        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Failed to update lead."));
      }

      await writeAuditEventSafe({
        tenantId,
        actorId: resolveActorId(request),
        action: "lead.updated",
        entityType: "lead",
        entityId: updated.id,
        metadata: {
          changedFields: (Object.keys(body) as (keyof typeof body)[]).filter(
            (k) => body[k] !== undefined,
          ),
        },
        ip: request.ip,
      });

      const lead = mapLeadRow(updated as LeadRow);

      publishTenantEvent(tenantId, {
        type: "lead:updated",
        tenantId,
        timestamp: new Date().toISOString(),
        lead,
      });

      const previousAgentId = (existingRows[0] as LeadRow).assignedAgentId;
      const assignmentChanged =
        body.assignedAgentId !== undefined &&
        updated.assignedAgentId !== null &&
        updated.assignedAgentId !== previousAgentId;

      if (assignmentChanged) {
        await createNotifications({
          tenantId,
          userIds: [updated.assignedAgentId!],
          type: "lead_assigned",
          title: "Lead assigned to you",
          body: `${updated.firstName} ${updated.lastName} was assigned to you.`,
          leadId: updated.id,
          excludeUserId: resolveActorId(request),
        });
      }

      return reply.status(200).send({ lead });
    },
  );

  // DELETE /leads/:id
  zodApp.delete(
    "/leads/:id",
    {
      schema: {
        params: leadParamsSchema,
        response: { 200: leadSingleResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = leadParamsSchema.parse(request.params);

      const existingRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select(leadSelectFields)
          .from(leads)
          .where(and(eq(leads.id, id), isNull(leads.softDeletedAt)))
          .limit(1);
      });

      if (!existingRows[0]) {
        return reply
          .status(404)
          .send(apiError("Not Found", "Lead not found."));
      }

      const now = new Date();
      const deletedRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .update(leads)
          .set({ softDeletedAt: now, updatedAt: now })
          .where(eq(leads.id, id))
          .returning(leadSelectFields);
      });

      const deleted = deletedRows[0];

      if (!deleted) {
        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Failed to delete lead."));
      }

      await writeAuditEventSafe({
        tenantId,
        actorId: resolveActorId(request),
        action: "lead.deleted",
        entityType: "lead",
        entityId: deleted.id,
        metadata: {
          firstName: deleted.firstName,
          lastName: deleted.lastName,
          email: deleted.email,
        },
        ip: request.ip,
      });

      const lead = mapLeadRow(deleted as LeadRow);

      publishTenantEvent(tenantId, {
        type: "lead:deleted",
        tenantId,
        timestamp: new Date().toISOString(),
        lead,
      });

      return reply.status(200).send({ lead });
    },
  );

  // PATCH /leads/:id/stage
  zodApp.patch(
    "/leads/:id/stage",
    {
      schema: {
        params: leadParamsSchema,
        body: moveLeadStageSchema,
        response: { 200: leadSingleResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = leadParamsSchema.parse(request.params);
      const { stageId } = moveLeadStageSchema.parse(request.body);
      const actorId = resolveActorId(request);

      const result = await runInTenantContext(tenantId, async (tx) => {
        const [lead] = await tx
          .select(leadSelectFields)
          .from(leads)
          .where(and(eq(leads.id, id), isNull(leads.softDeletedAt)))
          .limit(1);

        if (!lead) return { type: "lead_not_found" } as const;

        const [newStage] = await tx
          .select({ id: pipelineStages.id, name: pipelineStages.name })
          .from(pipelineStages)
          .where(eq(pipelineStages.id, stageId))
          .limit(1);

        if (!newStage) return { type: "stage_not_found" } as const;

        let oldStageName: string | null = null;

        if (lead.stageId) {
          const [oldStage] = await tx
            .select({ name: pipelineStages.name })
            .from(pipelineStages)
            .where(eq(pipelineStages.id, lead.stageId))
            .limit(1);

          oldStageName = oldStage?.name ?? null;
        }

        const [updated] = await tx
          .update(leads)
          .set({ stageId, updatedAt: new Date() })
          .where(eq(leads.id, id))
          .returning(leadSelectFields);

        const activityContent = oldStageName
          ? `Stage changed from "${oldStageName}" to "${newStage.name}"`
          : `Stage changed to "${newStage.name}"`;

        await tx.insert(leadActivities).values({
          leadId: id,
          type: "stage_change",
          content: activityContent,
          createdBy: actorId,
        });

        return {
          type: "success",
          lead: updated!,
          oldStageId: lead.stageId,
          newStageName: newStage.name,
          oldStageName,
        } as const;
      });

      if (result.type === "lead_not_found") {
        return reply
          .status(404)
          .send(apiError("Not Found", "Lead not found."));
      }

      if (result.type === "stage_not_found") {
        return reply
          .status(404)
          .send(apiError("Not Found", "Pipeline stage not found."));
      }

      await writeAuditEventSafe({
        tenantId,
        actorId,
        action: "lead.stage_changed",
        entityType: "lead",
        entityId: id,
        metadata: {
          fromStage: result.oldStageName,
          toStage: result.newStageName,
          stageId,
        },
        ip: request.ip,
      });

      const lead = mapLeadRow(result.lead as LeadRow);

      publishTenantEvent(tenantId, {
        type: "lead:moved",
        tenantId,
        timestamp: new Date().toISOString(),
        lead,
        fromStageId: result.oldStageId,
        toStageId: stageId,
        fromStageName: result.oldStageName,
        toStageName: result.newStageName,
      });

      return reply.status(200).send({ lead });
    },
  );

  // POST /leads/:id/activities
  zodApp.post(
    "/leads/:id/activities",
    {
      schema: {
        params: leadParamsSchema,
        body: createLeadActivitySchema,
        response: { 201: leadActivitySingleResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = leadParamsSchema.parse(request.params);
      const body = createLeadActivitySchema.parse(request.body);
      const actorId = resolveActorId(request);
      const sessionUserId = requireSessionUserId(request);

      const leadRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select({ id: leads.id })
          .from(leads)
          .where(and(eq(leads.id, id), isNull(leads.softDeletedAt)))
          .limit(1);
      });

      if (!leadRows[0]) {
        return reply
          .status(404)
          .send(apiError("Not Found", "Lead not found."));
      }

      const activityRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .insert(leadActivities)
          .values({
            leadId: id,
            type: body.type,
            content: body.content,
            createdBy: actorId ?? sessionUserId,
          })
          .returning(activitySelectFields);
      });

      const created = activityRows[0];

      if (!created) {
        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Failed to create activity."));
      }

      const activity = mapActivityRow(created as LeadActivityRow);

      publishTenantEvent(tenantId, {
        type: "activity:created",
        tenantId,
        timestamp: new Date().toISOString(),
        activity,
      });

      return reply.status(201).send({ activity });
    },
  );

  // GET /leads/:id/activities
  zodApp.get(
    "/leads/:id/activities",
    {
      schema: {
        params: leadParamsSchema,
        response: { 200: leadActivityListResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = leadParamsSchema.parse(request.params);

      const leadRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select({ id: leads.id })
          .from(leads)
          .where(and(eq(leads.id, id), isNull(leads.softDeletedAt)))
          .limit(1);
      });

      if (!leadRows[0]) {
        return reply
          .status(404)
          .send(apiError("Not Found", "Lead not found."));
      }

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select(activitySelectFields)
          .from(leadActivities)
          .where(eq(leadActivities.leadId, id))
          .orderBy(desc(leadActivities.createdAt));
      });

      return reply.status(200).send({
        activities: rows.map((r) => mapActivityRow(r as LeadActivityRow)),
      });
    },
  );

  // POST /leads/:id/schedule-visit
  zodApp.post(
    "/leads/:id/schedule-visit",
    {
      schema: {
        params: leadParamsSchema,
        body: scheduleVisitSchema,
        response: { 201: scheduleVisitResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = leadParamsSchema.parse(request.params);
      const body = scheduleVisitSchema.parse(request.body);
      const actorId = resolveActorId(request);
      const sessionUserId = requireSessionUserId(request);

      const summary = formatVisitScheduleSummary(body.scheduledAt, body.timezone);
      const content = body.notes
        ? `Visit scheduled for ${summary} — ${body.notes}`
        : `Visit scheduled for ${summary}`;

      const result = await runInTenantContext(tenantId, async (tx) => {
        const [lead] = await tx
          .select({
            id: leads.id,
            propertyId: leads.propertyId,
            assignedAgentId: leads.assignedAgentId,
            firstName: leads.firstName,
            lastName: leads.lastName,
          })
          .from(leads)
          .where(and(eq(leads.id, id), isNull(leads.softDeletedAt)))
          .limit(1);

        if (!lead) return { type: "lead_not_found" } as const;

        const propertyId = body.propertyId ?? lead.propertyId;

        if (!propertyId) {
          return { type: "property_required" } as const;
        }

        const [property] = await tx
          .select({ id: properties.id })
          .from(properties)
          .where(and(eq(properties.id, propertyId), isNull(properties.softDeletedAt)))
          .limit(1);

        if (!property) return { type: "property_not_found" } as const;

        const [activity] = await tx
          .insert(leadActivities)
          .values({
            leadId: id,
            type: "visit_scheduled",
            content,
            createdBy: actorId ?? sessionUserId,
          })
          .returning(activitySelectFields);

        return {
          type: "success",
          activity: activity!,
          propertyId,
          assignedAgentId: lead.assignedAgentId,
          leadName: `${lead.firstName} ${lead.lastName}`,
        } as const;
      });

      if (result.type === "lead_not_found") {
        return reply.status(404).send(apiError("Not Found", "Lead not found."));
      }

      if (result.type === "property_required") {
        return reply
          .status(400)
          .send(
            apiError(
              "Bad Request",
              "A property is required to schedule a visit.",
            ),
          );
      }

      if (result.type === "property_not_found") {
        return reply
          .status(404)
          .send(apiError("Not Found", "Property not found."));
      }

      await writeAuditEventSafe({
        tenantId,
        actorId,
        action: "visit.scheduled",
        entityType: "lead",
        entityId: id,
        metadata: {
          propertyId: result.propertyId,
          scheduledAt: body.scheduledAt,
          timezone: body.timezone,
        },
        ip: request.ip,
      });

      await enqueueVisitConfirmationJobSafe({
        tenantId,
        leadId: id,
        propertyId: result.propertyId,
        scheduledAt: body.scheduledAt,
        timezone: body.timezone,
      });

      if (result.assignedAgentId) {
        await createNotifications({
          tenantId,
          userIds: [result.assignedAgentId],
          type: "visit_scheduled",
          title: "Visit scheduled",
          body: `A visit was scheduled for ${result.leadName} — ${summary}.`,
          leadId: id,
          excludeUserId: actorId,
        });
      }

      const activity = mapActivityRow(result.activity as LeadActivityRow);

      publishTenantEvent(tenantId, {
        type: "activity:created",
        tenantId,
        timestamp: new Date().toISOString(),
        activity,
      });

      return reply.status(201).send({ activity });
    },
  );
}
