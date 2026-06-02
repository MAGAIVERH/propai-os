import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organization } from "./auth.js";

export const tenantSettings = pgTable("tenant_settings", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull().default("America/New_York"),
  currency: text("currency").notNull().default("USD"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
