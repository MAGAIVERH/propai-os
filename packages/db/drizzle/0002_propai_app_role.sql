DO $$ BEGIN
  CREATE ROLE propai_app LOGIN PASSWORD 'propai_app';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
GRANT CONNECT ON DATABASE propai TO propai_app;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO propai_app;
--> statement-breakpoint
GRANT USAGE ON SCHEMA app TO propai_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON tenants TO propai_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_settings TO propai_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON test_items TO propai_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app.set_current_tenant(uuid) TO propai_app;
