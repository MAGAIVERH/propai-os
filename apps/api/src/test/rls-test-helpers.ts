import { eq, or } from "drizzle-orm";

import {
  closeDb,
  getDb,
  organization,
  testItems,
  withTenantContext,
} from "@propai/db";

export type RlsTestSeed = {
  tenantAId: string;
  tenantBId: string;
};

export async function seedRlsTestData(): Promise<RlsTestSeed> {
  const adminDb = getDb();

  await adminDb.delete(testItems);
  // Delete only the known test orgs — never wipe the whole table so real
  // user brokerages created during development are not destroyed.
  await adminDb.delete(organization).where(
    or(
      eq(organization.slug, "api-rls-tenant-a"),
      eq(organization.slug, "api-rls-tenant-b"),
    ),
  );

  const [tenantA] = await adminDb
    .insert(organization)
    .values({ name: "API Tenant A", slug: "api-rls-tenant-a" })
    .returning();

  const [tenantB] = await adminDb
    .insert(organization)
    .values({ name: "API Tenant B", slug: "api-rls-tenant-b" })
    .returning();

  if (!tenantA || !tenantB) {
    throw new Error("Failed to seed organizations for API RLS tests.");
  }

  await withTenantContext(tenantA.id, async (tx) => {
    await tx.insert(testItems).values([
      { tenantId: tenantA.id, name: "Item A1" },
      { tenantId: tenantA.id, name: "Item A2" },
    ]);
  });

  await withTenantContext(tenantB.id, async (tx) => {
    await tx.insert(testItems).values([
      { tenantId: tenantB.id, name: "Item B1" },
      { tenantId: tenantB.id, name: "Item B2" },
    ]);
  });

  return {
    tenantAId: tenantA.id,
    tenantBId: tenantB.id,
  };
}

export async function teardownRlsTestData(): Promise<void> {
  await closeDb();
}
