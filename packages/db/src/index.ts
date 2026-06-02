export { closeDb, getAppDb, getDb, type Db } from "./client.js";
export { getDatabaseUrl, loadEnv } from "./env.js";
export {
  tenantSettings,
  tenantSettingsRelations,
  tenants,
  tenantsRelations,
  testItems,
} from "./schema/index.js";
export { setTenantContext, withTenantContext } from "./tenant-context.js";

export const DB_PACKAGE_VERSION = "0.2.0" as const;
