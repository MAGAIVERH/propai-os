import { eq } from "drizzle-orm";

import { getDb } from "../client.js";
import { member, organization, tenantSettings, user } from "../schema/index.js";
import { parseBrokerageRole } from "@propai/shared";

type SeedDevResult = {
  organizationId: string;
  userId: string;
  memberId: string;
};

/** Seeds one dev organization, owner user, member row, and settings. */
export async function seedDevIdentity(): Promise<SeedDevResult> {
  const db = getDb();
  const devUserId = "dev-user-owner-001";
  const devMemberId = "dev-member-owner-001";
  const devOrgSlug = "dev-brokerage";

  const existingOrg = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, devOrgSlug))
    .limit(1);

  if (existingOrg[0]) {
    return {
      organizationId: existingOrg[0].id,
      userId: devUserId,
      memberId: devMemberId,
    };
  }

  const [org] = await db
    .insert(organization)
    .values({
      name: "Dev Brokerage",
      slug: devOrgSlug,
    })
    .returning();

  if (!org) {
    throw new Error("Failed to seed dev organization.");
  }

  await db
    .insert(user)
    .values({
      id: devUserId,
      name: "Dev Owner",
      email: "owner@dev.propai-os.local",
      emailVerified: true,
    })
    .onConflictDoNothing();

  const ownerRole = parseBrokerageRole("owner");

  if (!ownerRole) {
    throw new Error("Invalid owner role in seed script.");
  }

  await db
    .insert(member)
    .values({
      id: devMemberId,
      organizationId: org.id,
      userId: devUserId,
      role: ownerRole,
    })
    .onConflictDoNothing();

  await db
    .insert(tenantSettings)
    .values({
      organizationId: org.id,
    })
    .onConflictDoNothing();

  return {
    organizationId: org.id,
    userId: devUserId,
    memberId: devMemberId,
  };
}
