import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { tenants } from "./tenants.js";

/** POC table for Row-Level Security tenant isolation (Day 7). */
export const testItems = pgTable("test_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
