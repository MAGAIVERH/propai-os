import { z } from "zod";

export const LEAD_ACTIVITY_TYPES = [
  "note",
  "call",
  "email",
  "stage_change",
  "visit_scheduled",
] as const;

export const leadActivityTypeSchema = z.enum(LEAD_ACTIVITY_TYPES);
export type LeadActivityType = z.infer<typeof leadActivityTypeSchema>;

// ── Pipeline stages ──────────────────────────────────────────────────────────

export const pipelineStageSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string().trim().min(1),
  sortOrder: z.number().int().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color"),
  isWon: z.boolean(),
  isLost: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type PipelineStage = z.infer<typeof pipelineStageSchema>;

export const pipelineStageListResponseSchema = z.object({
  stages: z.array(pipelineStageSchema),
});

export type PipelineStageListResponse = z.infer<typeof pipelineStageListResponseSchema>;

// ── Leads ─────────────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().optional(),
  source: z.string().trim().optional(),
  assignedAgentId: z.string().optional(),
  propertyId: z.uuid().optional(),
  stageId: z.uuid().optional(),
  notes: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial();
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const moveLeadStageSchema = z.object({
  stageId: z.uuid(),
});

export type MoveLeadStageInput = z.infer<typeof moveLeadStageSchema>;

export const leadResponseSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  source: z.string().nullable(),
  assignedAgentId: z.string().nullable(),
  propertyId: z.uuid().nullable(),
  stageId: z.uuid().nullable(),
  aiScore: z.number().int().min(0).max(100).nullable(),
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type LeadResponse = z.infer<typeof leadResponseSchema>;

export const leadListQuerySchema = z.object({
  stageId: z.uuid().optional(),
  assignedAgentId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type LeadListQuery = z.infer<typeof leadListQuerySchema>;

export const leadListResponseSchema = z.object({
  leads: z.array(leadResponseSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int(),
});

export type LeadListResponse = z.infer<typeof leadListResponseSchema>;

// ── Lead activities ───────────────────────────────────────────────────────────

export const createLeadActivitySchema = z.object({
  type: leadActivityTypeSchema,
  content: z.string().trim().min(1),
});

export type CreateLeadActivityInput = z.infer<typeof createLeadActivitySchema>;

export const leadActivityResponseSchema = z.object({
  id: z.uuid(),
  leadId: z.uuid(),
  type: leadActivityTypeSchema,
  content: z.string(),
  createdBy: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export type LeadActivityResponse = z.infer<typeof leadActivityResponseSchema>;

export const leadActivityListResponseSchema = z.object({
  activities: z.array(leadActivityResponseSchema),
});

export type LeadActivityListResponse = z.infer<typeof leadActivityListResponseSchema>;

// ── Lead params ───────────────────────────────────────────────────────────────

export const leadParamsSchema = z.object({
  id: z.uuid(),
});

export type LeadParams = z.infer<typeof leadParamsSchema>;
