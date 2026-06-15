import { z } from "zod";

export const AUDIT_ACTIONS = [
  "organization.created",
  "test_item.created",
  "invitation.sent",
  "invitation.accepted",
  "property.created",
  "property.updated",
  "property.deleted",
  "photo.uploaded",
  "lead.created",
  "lead.updated",
  "lead.deleted",
  "lead.stage_changed",
] as const;

export const auditActionSchema = z.enum(AUDIT_ACTIONS);

export type AuditAction = z.infer<typeof auditActionSchema>;

export const auditLogListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).optional(),
});

export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;

export const auditLogEntrySchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  actorId: z.string().nullable(),
  action: auditActionSchema,
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()),
  ip: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

/** Single audit log row (GET by id or create response). */
export const auditLogResponseSchema = auditLogEntrySchema;

export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;

export const auditLogListResponseSchema = z.object({
  items: z.array(auditLogEntrySchema),
  nextCursor: z.string().nullable(),
});

export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>;
