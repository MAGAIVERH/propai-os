DROP POLICY IF EXISTS "test_items_tenant_isolation" ON "test_items";
--> statement-breakpoint
CREATE POLICY "test_items_tenant_isolation" ON "test_items"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);
