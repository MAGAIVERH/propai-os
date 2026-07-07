CREATE TYPE "public"."visit_status" AS ENUM('scheduled', 'completed', 'canceled');--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"property_id" uuid,
	"agent_id" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"timezone" text NOT NULL,
	"status" "visit_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_tenant_id_organization_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_agent_id_user_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "visits_tenant_scheduled_idx" ON "visits" USING btree ("tenant_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "visits_lead_idx" ON "visits" USING btree ("lead_id");--> statement-breakpoint
ALTER TABLE "visits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "visits" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "visits_tenant_isolation" ON "visits"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON visits TO propai_app;
