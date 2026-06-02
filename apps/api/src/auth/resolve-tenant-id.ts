import { getTenantById } from "@propai/db";

import type { PropAiSession } from "./types.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Maps Better Auth `activeOrganizationId` to `tenants.id`.
 * Convention (Day 8): organization UUID equals tenant row UUID until a mapping table exists.
 */
export async function resolveTenantId(
  session: PropAiSession,
): Promise<string | null> {
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId || !UUID_PATTERN.test(organizationId)) {
    return null;
  }

  return getTenantById(organizationId);
}
