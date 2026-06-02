import { eq } from "drizzle-orm";

import { getDb } from "../client.js";
import { organization } from "../schema/auth.js";

/** Returns `organization.id` when the brokerage tenant exists. */
export async function getOrganizationById(
  organizationId: string,
): Promise<string | null> {
  const [row] = await getDb()
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  return row?.id ?? null;
}

/**
 * @deprecated Use `getOrganizationById` — alias kept for Day 7–8 callers.
 */
export async function getTenantById(tenantId: string): Promise<string | null> {
  return getOrganizationById(tenantId);
}
