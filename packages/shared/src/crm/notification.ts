import { z } from "zod";

export const NOTIFICATION_TYPES = ["lead_created", "lead_assigned", "visit_scheduled"] as const;

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationResponseSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  leadId: z.uuid().nullable(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

export const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const notificationListResponseSchema = z.object({
  notifications: z.array(notificationResponseSchema),
  unreadCount: z.number().int().min(0),
});

export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;

export const notificationParamsSchema = z.object({
  id: z.uuid(),
});

export type NotificationParams = z.infer<typeof notificationParamsSchema>;

export const markAllReadResponseSchema = z.object({
  updated: z.number().int().min(0),
});

export type MarkAllReadResponse = z.infer<typeof markAllReadResponseSchema>;
