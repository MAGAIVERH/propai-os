import {
  closeDb,
  getDb,
  tenants,
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
  await adminDb.delete(tenants);

  const [tenantA] = await adminDb
    .insert(tenants)
    .values({ name: "API Tenant A", slug: "api-rls-tenant-a" })
    .returning();

  const [tenantB] = await adminDb
    .insert(tenants)
    .values({ name: "API Tenant B", slug: "api-rls-tenant-b" })
    .returning();

  if (!tenantA || !tenantB) {
    throw new Error("Failed to seed tenants for API RLS tests.");
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
