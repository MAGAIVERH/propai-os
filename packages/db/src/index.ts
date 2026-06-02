export { closeDb, getAppDb, getDb, type Db } from "./client.js";
export { TenantContextRequiredError } from "./errors.js";
export { getDatabaseUrl, loadEnv } from "./env.js";
export { getTenantById } from "./queries/get-tenant-by-id.js";
export {
  tenantSettings,
  tenantSettingsRelations,
  tenants,
  tenantsRelations,
  testItems,
} from "./schema/index.js";
export {
  runInTenantContext,
  setTenantContext,
  withTenantContext,
  type DbTransaction,
} from "./tenant-context.js";

export const DB_PACKAGE_VERSION = "0.2.0" as const;
