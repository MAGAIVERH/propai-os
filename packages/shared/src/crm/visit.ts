import { z } from "zod";

import { leadActivityResponseSchema } from "./lead.js";

/**
 * BullMQ queue + job name for async visit confirmation emails (Day 44).
 * BullMQ v5 forbids ":" in queue names (it is the Redis key separator), so the
 * queue uses hyphens while the job itself stays "send-confirmation".
 */
export const VISITS_SEND_CONFIRMATION_QUEUE_NAME = "visits-send-confirmation";
export const VISITS_SEND_CONFIRMATION_JOB_NAME = "send-confirmation";

// ── Schedule visit request ─────────────────────────────────────────────────────

/**
 * Request body for POST /leads/:id/schedule-visit.
 * `scheduledAt` is a UTC ISO instant; `timezone` is an IANA zone (e.g.
 * "America/Chicago") used to render the local date/time in the email.
 */
export const scheduleVisitSchema = z.object({
  scheduledAt: z.iso.datetime(),
  timezone: z.string().trim().min(1),
  propertyId: z.uuid().optional(),
  notes: z.string().trim().min(1).optional(),
});

export type ScheduleVisitInput = z.infer<typeof scheduleVisitSchema>;

export const scheduleVisitResponseSchema = z.object({
  activity: leadActivityResponseSchema,
});

export type ScheduleVisitResponse = z.infer<typeof scheduleVisitResponseSchema>;

// ── Visits list (derived from visit_scheduled activities) ───────────────────────

/**
 * A scheduled showing, surfaced from the `visit_scheduled` lead activity joined
 * to its lead and (optional) property. `content` holds the scheduling note (for
 * product-created visits it includes the formatted local date/time).
 */
export const visitListItemSchema = z.object({
  id: z.uuid(),
  leadId: z.uuid(),
  leadName: z.string(),
  propertyId: z.uuid().nullable(),
  propertyTitle: z.string().nullable(),
  agentId: z.string().nullable(),
  content: z.string(),
  createdAt: z.iso.datetime(),
});

export type VisitListItem = z.infer<typeof visitListItemSchema>;

export const visitListResponseSchema = z.object({
  visits: z.array(visitListItemSchema),
});

export type VisitListResponse = z.infer<typeof visitListResponseSchema>;

// ── Confirmation email job payload ──────────────────────────────────────────────

export const sendVisitConfirmationJobDataSchema = z.object({
  tenantId: z.uuid(),
  leadId: z.uuid(),
  propertyId: z.uuid(),
  scheduledAt: z.iso.datetime(),
  timezone: z.string().trim().min(1),
});

export type SendVisitConfirmationJobData = z.infer<typeof sendVisitConfirmationJobDataSchema>;
