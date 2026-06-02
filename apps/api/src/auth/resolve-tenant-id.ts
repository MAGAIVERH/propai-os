import { getOrganizationById } from "@propai/db";

import type { PropAiSession } from "./types.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Maps Better Auth `activeOrganizationId` to `organization.id`.
 * Organization UUID is the tenant root for RLS (`tenant_id` columns).
 */
export async function resolveTenantId(
  session: PropAiSession,
): Promise<string | null> {
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId || !UUID_PATTERN.test(organizationId)) {
    return null;
  }

  return getOrganizationById(organizationId);
}
