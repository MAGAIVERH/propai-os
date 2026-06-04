import { eq } from "drizzle-orm";

import { getDb } from "../client.js";
import { organization } from "../schema/auth.js";

export type OrganizationProfile = {
  id: string;
  name: string;
  slug: string;
};

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

/** Returns public org fields for the active tenant (API /v1/organization/me). */
export async function getOrganizationProfileById(
  organizationId: string,
): Promise<OrganizationProfile | null> {
  const [row] = await getDb()
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  return row ?? null;
}

/**
 * @deprecated Use `getOrganizationById` — alias kept for Day 7–8 callers.
 */
export async function getTenantById(tenantId: string): Promise<string | null> {
  return getOrganizationById(tenantId);
}
