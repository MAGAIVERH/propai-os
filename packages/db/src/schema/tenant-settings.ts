import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organization } from "./auth.js";

/** Subscription tier (Day 60). `free` is the default for new brokerages. */
export const billingPlanEnum = pgEnum("billing_plan", ["free", "pro"]);

export const tenantSettings = pgTable("tenant_settings", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull().default("America/New_York"),
  currency: text("currency").notNull().default("USD"),
  logoUrl: text("logo_url"),
  // Branding (Day 64)
  primaryColor: text("primary_color").notNull().default("#10b981"),
  marketplaceSlug: text("marketplace_slug"),
  // Billing (Day 60)
  plan: billingPlanEnum("plan").notNull().default("free"),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Onboarding (Day 62)
  onboardingCompletedAt: timestamp("onboarding_completed_at", {
    withTimezone: true,
    mode: "date",
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/**
 * Processed Stripe webhook event ids — for idempotency (Day 65). Global
 * (not tenant-scoped); written by the webhook handler via the admin role.
 */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
