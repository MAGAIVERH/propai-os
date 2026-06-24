import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organization, user } from "./auth.js";
import { leads } from "./crm.js";

export const notificationTypeEnum = pgEnum("notification_type", [
  "lead_created",
  "lead_assigned",
  "visit_scheduled",
]);

/**
 * In-app notification for a brokerage user (Day 45). Tenant-scoped via RLS on
 * tenant_id; the API additionally filters by the recipient's user_id.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    leadId: uuid("lead_id").references(() => leads.id, {
      onDelete: "cascade",
    }),
    readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_tenant_user_created_idx").on(
      table.tenantId,
      table.userId,
      table.createdAt.desc(),
    ),
    index("notifications_tenant_user_read_idx").on(table.tenantId, table.userId, table.readAt),
  ],
);
