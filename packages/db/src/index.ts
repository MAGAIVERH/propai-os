export { closeDb, getAppDb, getDb, type Db } from "./client.js";
export { TenantContextRequiredError } from "./errors.js";
export { getDatabaseUrl, loadEnv } from "./env.js";
export {
  getOrganizationById,
  getTenantById,
} from "./queries/get-tenant-by-id.js";
export {
  getInitialOrganizationIdForUser,
  isOrganizationSlugTaken,
} from "./queries/organization-auth.js";
export { seedDevIdentity } from "./seed/dev-identity.js";
export {
  account,
  authSchema,
  invitation,
  member,
  organization,
  session,
  tenantSettings,
  tenants,
  testItems,
  user,
  verification,
} from "./schema/index.js";
export {
  runInTenantContext,
  setTenantContext,
  withTenantContext,
  type DbTransaction,
} from "./tenant-context.js";

export const DB_PACKAGE_VERSION = "0.3.0" as const;
