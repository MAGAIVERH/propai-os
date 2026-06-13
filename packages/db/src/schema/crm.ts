import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth.js";
import { properties } from "./properties.js";

export const leadActivityTypeEnum = pgEnum("lead_activity_type", [
  "note",
  "call",
  "email",
  "stage_change",
  "visit_scheduled",
]);

/** Kanban columns per brokerage tenant (Day 36). Tenant-scoped via RLS on tenant_id. */
export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    color: text("color").notNull().default("#6B7280"),
    isWon: boolean("is_won").notNull().default(false),
    isLost: boolean("is_lost").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pipeline_stages_tenant_sort_idx").on(
      table.tenantId,
      table.sortOrder,
    ),
  ],
);

/** Prospective buyer or renter (Day 36). Tenant-scoped via RLS on tenant_id. */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    source: text("source"),
    assignedAgentId: text("assigned_agent_id").references(() => user.id, {
      onDelete: "set null",
    }),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    stageId: uuid("stage_id").references(() => pipelineStages.id, {
      onDelete: "set null",
    }),
    aiScore: integer("ai_score"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    softDeletedAt: timestamp("soft_deleted_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    index("leads_tenant_stage_idx").on(table.tenantId, table.stageId),
    index("leads_tenant_email_idx").on(table.tenantId, table.email),
    index("leads_tenant_created_at_idx").on(
      table.tenantId,
      table.createdAt.desc(),
    ),
  ],
);

/** Timeline of interactions on a lead (Day 36). Parent-scoped RLS via leads.tenant_id. */
export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: leadActivityTypeEnum("type").notNull(),
    content: text("content").notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("lead_activities_lead_id_idx").on(table.leadId),
    index("lead_activities_lead_created_at_idx").on(
      table.leadId,
      table.createdAt.desc(),
    ),
  ],
);
