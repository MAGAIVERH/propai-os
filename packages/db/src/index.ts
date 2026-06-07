export {
  auditLog,
  logAuditEvent,
  type LogAuditEventInput,
  type LogAuditEventResult,
} from "./audit/audit-log.js";
export { closeDb, getAppDb, getDb, type Db } from "./client.js";
export { TenantContextRequiredError } from "./errors.js";
export { getAppDatabaseUrl, getDatabaseUrl, loadEnv } from "./env.js";
export {
  getOrganizationById,
  getOrganizationProfileById,
  getTenantById,
  type OrganizationProfile,
} from "./queries/get-tenant-by-id.js";
export {
  getInitialOrganizationIdForUser,
  getMemberRoleForOrganization,
  isOrganizationSlugTaken,
} from "./queries/organization-auth.js";
export { seedDevIdentity } from "./seed/dev-identity.js";
export {
  account,
  auditLogs,
  authSchema,
  invitation,
  member,
  organization,
  properties,
  propertyImages,
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
