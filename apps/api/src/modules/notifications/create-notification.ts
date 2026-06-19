import { member, notifications, runInTenantContext } from "@propai/db";
import type { NotificationResponse, NotificationType } from "@propai/shared";
import { eq } from "drizzle-orm";

import { publishTenantEvent } from "../realtime/bus.js";

export type CreateNotificationInput = {
  tenantId: string;
  /** Recipient user ids. Duplicates and the excluded actor are removed. */
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  leadId?: string | null;
  /** Skip notifying the actor who triggered the event (no self-notifications). */
  excludeUserId?: string | null;
};

const notificationSelectFields = {
  id: notifications.id,
  tenantId: notifications.tenantId,
  userId: notifications.userId,
  type: notifications.type,
  title: notifications.title,
  body: notifications.body,
  leadId: notifications.leadId,
  readAt: notifications.readAt,
  createdAt: notifications.createdAt,
} as const;

type NotificationRow = {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  leadId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function mapNotificationRow(row: NotificationRow): NotificationResponse {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    leadId: row.leadId,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Active member user ids for a brokerage tenant. */
export async function getTenantMemberUserIds(
  tenantId: string,
): Promise<string[]> {
  const rows = await runInTenantContext(tenantId, async (tx) => {
    return tx
      .select({ userId: member.userId })
      .from(member)
      .where(eq(member.organizationId, tenantId));
  });

  return rows.map((r) => r.userId);
}

/**
 * Persists one notification per recipient and pushes a `notification:created`
 * realtime event for each. Best-effort: failures are logged, never thrown, so a
 * notification problem can't break the originating request.
 */
export async function createNotifications(
  input: CreateNotificationInput,
): Promise<NotificationResponse[]> {
  const recipients = [...new Set(input.userIds)].filter(
    (id) => id && id !== input.excludeUserId,
  );

  if (recipients.length === 0) {
    return [];
  }

  try {
    const rows = await runInTenantContext(input.tenantId, async (tx) => {
      return tx
        .insert(notifications)
        .values(
          recipients.map((userId) => ({
            tenantId: input.tenantId,
            userId,
            type: input.type,
            title: input.title,
            body: input.body,
            leadId: input.leadId ?? null,
          })),
        )
        .returning(notificationSelectFields);
    });

    const mapped = rows.map((r) => mapNotificationRow(r as NotificationRow));

    for (const notification of mapped) {
      publishTenantEvent(input.tenantId, {
        type: "notification:created",
        tenantId: input.tenantId,
        timestamp: new Date().toISOString(),
        notification,
      });
    }

    return mapped;
  } catch (error) {
    console.error(
      {
        tenantId: input.tenantId,
        type: input.type,
        err: error instanceof Error ? error.message : String(error),
      },
      "Failed to create notifications",
    );
    return [];
  }
}
