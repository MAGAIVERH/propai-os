import { z } from "zod";

import { leadActivityResponseSchema, leadResponseSchema } from "./lead.js";
import { notificationResponseSchema } from "./notification.js";

// ── Real-time CRM events (Day 43 — WebSocket catch-up) ────────────────────────

export const leadCreatedEventSchema = z.object({
  type: z.literal("lead:created"),
  tenantId: z.uuid(),
  timestamp: z.iso.datetime(),
  lead: leadResponseSchema,
});

export type LeadCreatedEvent = z.infer<typeof leadCreatedEventSchema>;

export const leadUpdatedEventSchema = z.object({
  type: z.literal("lead:updated"),
  tenantId: z.uuid(),
  timestamp: z.iso.datetime(),
  lead: leadResponseSchema,
});

export type LeadUpdatedEvent = z.infer<typeof leadUpdatedEventSchema>;

export const leadMovedEventSchema = z.object({
  type: z.literal("lead:moved"),
  tenantId: z.uuid(),
  timestamp: z.iso.datetime(),
  lead: leadResponseSchema,
  fromStageId: z.uuid().nullable(),
  toStageId: z.uuid(),
  fromStageName: z.string().nullable(),
  toStageName: z.string(),
});

export type LeadMovedEvent = z.infer<typeof leadMovedEventSchema>;

export const leadDeletedEventSchema = z.object({
  type: z.literal("lead:deleted"),
  tenantId: z.uuid(),
  timestamp: z.iso.datetime(),
  lead: leadResponseSchema,
});

export type LeadDeletedEvent = z.infer<typeof leadDeletedEventSchema>;

export const activityCreatedEventSchema = z.object({
  type: z.literal("activity:created"),
  tenantId: z.uuid(),
  timestamp: z.iso.datetime(),
  activity: leadActivityResponseSchema,
});

export type ActivityCreatedEvent = z.infer<typeof activityCreatedEventSchema>;

export const notificationCreatedEventSchema = z.object({
  type: z.literal("notification:created"),
  tenantId: z.uuid(),
  timestamp: z.iso.datetime(),
  notification: notificationResponseSchema,
});

export type NotificationCreatedEvent = z.infer<
  typeof notificationCreatedEventSchema
>;

export const realtimeEventSchema = z.discriminatedUnion("type", [
  leadCreatedEventSchema,
  leadUpdatedEventSchema,
  leadMovedEventSchema,
  leadDeletedEventSchema,
  activityCreatedEventSchema,
  notificationCreatedEventSchema,
]);

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;
