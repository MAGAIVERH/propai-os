CREATE TYPE "public"."property_type" AS ENUM('single_family', 'condo', 'townhouse', 'multi_family');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('draft', 'active', 'under_contract', 'sold', 'rented');--> statement-breakpoint
CREATE TYPE "public"."rent_or_sale" AS ENUM('sale', 'rent');--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "property_type" NOT NULL,
	"status" "property_status" DEFAULT 'draft' NOT NULL,
	"price_usd_cents" integer NOT NULL,
	"rent_or_sale" "rent_or_sale" NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" numeric(3, 1) NOT NULL,
	"sq_ft" integer NOT NULL,
	"year_built" integer,
	"hoa_fee_usd" integer,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"soft_deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "property_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"feature_value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenant_id_organization_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_features" ADD CONSTRAINT "property_features_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "properties_tenant_status_idx" ON "properties" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "properties_tenant_city_state_idx" ON "properties" USING btree ("tenant_id","city","state");--> statement-breakpoint
CREATE INDEX "properties_geo_idx" ON "properties" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "property_features_property_id_idx" ON "property_features" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "property_features_property_key_uidx" ON "property_features" USING btree ("property_id","feature_key");--> statement-breakpoint
CREATE INDEX "property_images_property_id_sort_idx" ON "property_images" USING btree ("property_id","sort_order");--> statement-breakpoint
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "properties" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "properties_tenant_isolation" ON "properties"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO propai_app;--> statement-breakpoint
ALTER TABLE "property_features" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "property_features" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "property_features_tenant_isolation" ON "property_features"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_features.property_id
        AND p.tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_features.property_id
        AND p.tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    )
  );--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON property_features TO propai_app;--> statement-breakpoint
ALTER TABLE "property_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "property_images" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "property_images_tenant_isolation" ON "property_images"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_images.property_id
        AND p.tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_images.property_id
        AND p.tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    )
  );--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON property_images TO propai_app;
