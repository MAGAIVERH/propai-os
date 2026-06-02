export { closeDb, getDb, type Db } from "./client.js";
export { getDatabaseUrl, loadEnv } from "./env.js";
export {
  tenantSettings,
  tenantSettingsRelations,
  tenants,
  tenantsRelations,
} from "./schema/index.js";

export const DB_PACKAGE_VERSION = "0.1.0" as const;
