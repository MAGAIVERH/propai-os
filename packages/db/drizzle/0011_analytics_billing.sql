-- ── Analytics events (Day 56) ────────────────────────────────────────────────
CREATE TYPE "public"."analytics_event_type" AS ENUM('property_view');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "analytics_event_type" NOT NULL,
	"property_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tenant_id_organization_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_tenant_type_created_idx" ON "analytics_events" USING btree ("tenant_id","type","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_property_idx" ON "analytics_events" USING btree ("property_id");--> statement-breakpoint
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "analytics_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "analytics_events_tenant_isolation" ON "analytics_events"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON analytics_events TO propai_app;--> statement-breakpoint

-- ── Billing + branding + onboarding columns on tenant_settings (Days 60/62/64) ─
CREATE TYPE "public"."billing_plan" AS ENUM('free', 'pro');--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "primary_color" text DEFAULT '#10b981' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "marketplace_slug" text;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "plan" "billing_plan" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "subscription_status" text DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_settings_marketplace_slug_uidx" ON "tenant_settings" USING btree ("marketplace_slug") WHERE "marketplace_slug" IS NOT NULL;--> statement-breakpoint

-- ── Stripe webhook idempotency (Day 65) ──────────────────────────────────────
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
GRANT SELECT, INSERT ON stripe_events TO propai_app;--> statement-breakpoint

-- ── Analytics SQL views (Day 56) ─────────────────────────────────────────────
-- security_invoker=true so RLS on the underlying tables filters by the
-- querying tenant (current_setting('app.current_tenant')).
CREATE VIEW "lead_conversion_by_stage" WITH (security_invoker = true) AS
  SELECT
    ps.tenant_id,
    ps.id          AS stage_id,
    ps.name        AS stage_name,
    ps.sort_order,
    ps.is_won,
    ps.is_lost,
    COUNT(l.id) FILTER (WHERE l.soft_deleted_at IS NULL) AS lead_count
  FROM pipeline_stages ps
  LEFT JOIN leads l ON l.stage_id = ps.id AND l.tenant_id = ps.tenant_id
  GROUP BY ps.tenant_id, ps.id, ps.name, ps.sort_order, ps.is_won, ps.is_lost;--> statement-breakpoint
GRANT SELECT ON "lead_conversion_by_stage" TO propai_app;--> statement-breakpoint

CREATE VIEW "agent_performance" WITH (security_invoker = true) AS
  SELECT
    l.tenant_id,
    l.assigned_agent_id AS agent_id,
    COUNT(*) FILTER (WHERE l.soft_deleted_at IS NULL)                AS total_leads,
    COUNT(*) FILTER (WHERE ps.is_won  AND l.soft_deleted_at IS NULL) AS won_leads,
    COUNT(*) FILTER (WHERE ps.is_lost AND l.soft_deleted_at IS NULL) AS lost_leads
  FROM leads l
  LEFT JOIN pipeline_stages ps ON ps.id = l.stage_id
  WHERE l.assigned_agent_id IS NOT NULL
  GROUP BY l.tenant_id, l.assigned_agent_id;--> statement-breakpoint
GRANT SELECT ON "agent_performance" TO propai_app;--> statement-breakpoint

CREATE VIEW "avg_days_to_close" WITH (security_invoker = true) AS
  SELECT
    l.tenant_id,
    AVG(EXTRACT(EPOCH FROM (l.updated_at - l.created_at)) / 86400.0)
      FILTER (WHERE ps.is_won) AS avg_days,
    COUNT(*) FILTER (WHERE ps.is_won) AS closed_count
  FROM leads l
  LEFT JOIN pipeline_stages ps ON ps.id = l.stage_id
  WHERE l.soft_deleted_at IS NULL
  GROUP BY l.tenant_id;--> statement-breakpoint
GRANT SELECT ON "avg_days_to_close" TO propai_app;
