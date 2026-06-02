CREATE TABLE "test_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_items" ADD CONSTRAINT "test_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "app";--> statement-breakpoint
CREATE OR REPLACE FUNCTION "app"."set_current_tenant"(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_tenant', p_tenant_id::text, true);
END;
$$;--> statement-breakpoint
ALTER TABLE "test_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "test_items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "test_items_tenant_isolation" ON "test_items"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);