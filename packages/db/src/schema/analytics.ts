import { index, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { organization } from "./auth.js";
import { properties } from "./properties.js";

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", ["property_view"]);

/**
 * Lightweight, append-only event stream for product analytics (Day 56).
 * Currently records public marketplace property views; the enum can grow as
 * more events become worth tracking. Tenant-scoped via RLS on `tenant_id`.
 */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: analyticsEventTypeEnum("type").notNull(),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("analytics_events_tenant_type_created_idx").on(
      table.tenantId,
      table.type,
      table.createdAt,
    ),
    index("analytics_events_property_idx").on(table.propertyId),
  ],
);
