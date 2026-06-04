import { and, asc, eq } from "drizzle-orm";

import { getDb } from "../client.js";
import { member, organization } from "../schema/auth.js";

/** Returns the user's earliest organization membership for session bootstrap. */
export async function getInitialOrganizationIdForUser(
  userId: string,
): Promise<string | null> {
  const [row] = await getDb()
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .orderBy(asc(member.createdAt))
    .limit(1);

  return row?.organizationId ?? null;
}

/** Returns the member role for a user within an organization, if any. */
export async function getMemberRoleForOrganization(
  userId: string,
  organizationId: string,
): Promise<string | null> {
  const [row] = await getDb()
    .select({ role: member.role })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    )
    .limit(1);

  return row?.role ?? null;
}

/** Returns true when an organization slug is already registered. */
export async function isOrganizationSlugTaken(slug: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);

  return Boolean(row);
}
