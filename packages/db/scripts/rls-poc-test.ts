import { eq, sql } from "drizzle-orm";

import { logAuditEvent } from "../src/audit/audit-log.js";
import { closeDb, getAppDb, getDb } from "../src/client.js";
import {
  auditLogs,
  organization,
  properties,
  propertyFeatures,
  propertyImages,
  testItems,
} from "../src/schema/index.js";
import { withTenantContext } from "../src/tenant-context.js";

type PropertySeedInput = {
  tenantId: string;
  title: string;
  addressLine1: string;
  city: string;
};

function buildPropertySeed(input: PropertySeedInput) {
  return {
    tenantId: input.tenantId,
    title: input.title,
    type: "single_family" as const,
    priceUsdCents: 450_000_00,
    rentOrSale: "sale" as const,
    bedrooms: 3,
    bathrooms: "2.5",
    sqFt: 1800,
    addressLine1: input.addressLine1,
    city: input.city,
    state: "TX",
    zipCode: "78701",
  };
}

type TestResult = {
  name: string;
  passed: boolean;
  detail: string;
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function main(): Promise<void> {
  const adminDb = getDb();
  const appDb = getAppDb();
  const results: TestResult[] = [];

  await adminDb.execute(
    sql`TRUNCATE property_images, property_features, properties, audit_logs, test_items, tenant_settings, member, invitation, organization, "user" RESTART IDENTITY CASCADE`,
  );

  const [tenantA] = await adminDb
    .insert(organization)
    .values({ name: "Tenant A (RLS POC)", slug: "rls-poc-tenant-a" })
    .returning();

  const [tenantB] = await adminDb
    .insert(organization)
    .values({ name: "Tenant B (RLS POC)", slug: "rls-poc-tenant-b" })
    .returning();

  assert(tenantA !== undefined && tenantB !== undefined, "Failed to seed tenants");

  try {
    await withTenantContext(tenantA.id, async (tx) => {
      await tx.insert(testItems).values([
        { tenantId: tenantA.id, name: "Item A1" },
        { tenantId: tenantA.id, name: "Item A2" },
      ]);
    });
  } catch (error) {
    throw new Error(`Seed tenant A items failed: ${formatError(error)}`);
  }

  try {
    await withTenantContext(tenantB.id, async (tx) => {
      await tx.insert(testItems).values([
        { tenantId: tenantB.id, name: "Item B1" },
        { tenantId: tenantB.id, name: "Item B2" },
      ]);
    });
  } catch (error) {
    throw new Error(`Seed tenant B items failed: ${formatError(error)}`);
  }

  const auditSeedA = await logAuditEvent({
    tenantId: tenantA.id,
    actorId: null,
    action: "organization.created",
    entityType: "organization",
    entityId: tenantA.id,
    metadata: { slug: "rls-poc-tenant-a" },
  });

  const auditSeedB = await logAuditEvent({
    tenantId: tenantB.id,
    actorId: null,
    action: "organization.created",
    entityType: "organization",
    entityId: tenantB.id,
    metadata: { slug: "rls-poc-tenant-b" },
  });

  assert(
    auditSeedA.success && auditSeedB.success,
    "Failed to seed audit_logs for RLS POC",
  );

  let tenantAPropertyIds: string[] = [];
  let tenantBPropertyIds: string[] = [];

  try {
    await withTenantContext(tenantA.id, async (tx) => {
      const seededProperties = await tx
        .insert(properties)
        .values([
          buildPropertySeed({
            tenantId: tenantA.id,
            title: "Property A1",
            addressLine1: "100 Tenant A Ln",
            city: "Austin",
          }),
          buildPropertySeed({
            tenantId: tenantA.id,
            title: "Property A2",
            addressLine1: "200 Tenant A Ln",
            city: "Austin",
          }),
        ])
        .returning({ id: properties.id });

      tenantAPropertyIds = seededProperties.map((row) => row.id);

      for (const propertyId of tenantAPropertyIds) {
        await tx.insert(propertyFeatures).values({
          propertyId,
          featureKey: "pool",
          featureValue: "true",
        });
        await tx.insert(propertyImages).values({
          propertyId,
          storageKey: `tenants/${tenantA.id}/${propertyId}/primary.jpg`,
        });
      }
    });
  } catch (error) {
    throw new Error(`Seed tenant A properties failed: ${formatError(error)}`);
  }

  try {
    await withTenantContext(tenantB.id, async (tx) => {
      const seededProperties = await tx
        .insert(properties)
        .values([
          buildPropertySeed({
            tenantId: tenantB.id,
            title: "Property B1",
            addressLine1: "100 Tenant B Ln",
            city: "Dallas",
          }),
          buildPropertySeed({
            tenantId: tenantB.id,
            title: "Property B2",
            addressLine1: "200 Tenant B Ln",
            city: "Dallas",
          }),
        ])
        .returning({ id: properties.id });

      tenantBPropertyIds = seededProperties.map((row) => row.id);

      for (const propertyId of tenantBPropertyIds) {
        await tx.insert(propertyFeatures).values({
          propertyId,
          featureKey: "pool",
          featureValue: "true",
        });
        await tx.insert(propertyImages).values({
          propertyId,
          storageKey: `tenants/${tenantB.id}/${propertyId}/primary.jpg`,
        });
      }
    });
  } catch (error) {
    throw new Error(`Seed tenant B properties failed: ${formatError(error)}`);
  }

  assert(
    tenantAPropertyIds.length === 2 && tenantBPropertyIds.length === 2,
    "Failed to seed properties for RLS POC",
  );

  let tenantARows;

  try {
    tenantARows = await withTenantContext(tenantA.id, async (tx) => {
      return tx.select().from(testItems);
    });
  } catch (error) {
    throw new Error(`Select tenant A failed: ${formatError(error)}`);
  }

  results.push({
    name: "Tenant A sees only own rows",
    passed:
      tenantARows.length === 2 &&
      tenantARows.every((row) => row.tenantId === tenantA.id),
    detail: `expected 2 rows for tenant A, got ${tenantARows.length}`,
  });

  const tenantBRows = await withTenantContext(tenantB.id, async (tx) => {
    return tx.select().from(testItems);
  });

  results.push({
    name: "Tenant B sees only own rows",
    passed:
      tenantBRows.length === 2 &&
      tenantBRows.every((row) => row.tenantId === tenantB.id),
    detail: `expected 2 rows for tenant B, got ${tenantBRows.length}`,
  });

  const noContextRows = await appDb.select().from(testItems);

  results.push({
    name: "No tenant context returns zero rows",
    passed: noContextRows.length === 0,
    detail: `expected 0 rows without app.current_tenant, got ${noContextRows.length}`,
  });

  const crossTenantRows = await withTenantContext(tenantA.id, async (tx) => {
    return tx
      .select()
      .from(testItems)
      .where(sql`${testItems.tenantId} = ${tenantB.id}`);
  });

  results.push({
    name: "Tenant A cannot read tenant B rows by filter",
    passed: crossTenantRows.length === 0,
    detail: `expected 0 cross-tenant rows, got ${crossTenantRows.length}`,
  });

  const tenantAAuditRows = await withTenantContext(tenantA.id, async (tx) => {
    return tx.select({ id: auditLogs.id, tenantId: auditLogs.tenantId }).from(auditLogs);
  });

  results.push({
    name: "Tenant A sees only own audit_logs",
    passed:
      tenantAAuditRows.length === 1 &&
      tenantAAuditRows.every((row) => row.tenantId === tenantA.id),
    detail: `expected 1 audit row for tenant A, got ${tenantAAuditRows.length}`,
  });

  const tenantBAuditRows = await withTenantContext(tenantB.id, async (tx) => {
    return tx.select({ id: auditLogs.id, tenantId: auditLogs.tenantId }).from(auditLogs);
  });

  results.push({
    name: "Tenant B sees only own audit_logs",
    passed:
      tenantBAuditRows.length === 1 &&
      tenantBAuditRows.every((row) => row.tenantId === tenantB.id),
    detail: `expected 1 audit row for tenant B, got ${tenantBAuditRows.length}`,
  });

  const noContextAuditRows = await appDb
    .select({ id: auditLogs.id })
    .from(auditLogs);

  results.push({
    name: "No tenant context returns zero audit_logs",
    passed: noContextAuditRows.length === 0,
    detail: `expected 0 audit rows without app.current_tenant, got ${noContextAuditRows.length}`,
  });

  const crossTenantAuditRows = await withTenantContext(tenantA.id, async (tx) => {
    return tx
      .select({ id: auditLogs.id })
      .from(auditLogs)
      .where(sql`${auditLogs.tenantId} = ${tenantB.id}`);
  });

  results.push({
    name: "Tenant A cannot read tenant B audit_logs by filter",
    passed: crossTenantAuditRows.length === 0,
    detail: `expected 0 cross-tenant audit rows, got ${crossTenantAuditRows.length}`,
  });

  const tenantAPropertyRows = await withTenantContext(tenantA.id, async (tx) => {
    return tx
      .select({ id: properties.id, tenantId: properties.tenantId })
      .from(properties);
  });

  results.push({
    name: "Tenant A sees only own properties",
    passed:
      tenantAPropertyRows.length === 2 &&
      tenantAPropertyRows.every((row) => row.tenantId === tenantA.id),
    detail: `expected 2 properties for tenant A, got ${tenantAPropertyRows.length}`,
  });

  const tenantBPropertyRows = await withTenantContext(tenantB.id, async (tx) => {
    return tx
      .select({ id: properties.id, tenantId: properties.tenantId })
      .from(properties);
  });

  results.push({
    name: "Tenant B sees only own properties",
    passed:
      tenantBPropertyRows.length === 2 &&
      tenantBPropertyRows.every((row) => row.tenantId === tenantB.id),
    detail: `expected 2 properties for tenant B, got ${tenantBPropertyRows.length}`,
  });

  const noContextPropertyRows = await appDb
    .select({ id: properties.id })
    .from(properties);

  results.push({
    name: "No tenant context returns zero properties",
    passed: noContextPropertyRows.length === 0,
    detail: `expected 0 properties without app.current_tenant, got ${noContextPropertyRows.length}`,
  });

  const crossTenantPropertyRows = await withTenantContext(tenantA.id, async (tx) => {
    return tx
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.tenantId, tenantB.id));
  });

  results.push({
    name: "Tenant A cannot read tenant B properties by filter",
    passed: crossTenantPropertyRows.length === 0,
    detail: `expected 0 cross-tenant properties, got ${crossTenantPropertyRows.length}`,
  });

  const tenantAFeatureRows = await withTenantContext(tenantA.id, async (tx) => {
    return tx
      .select({
        id: propertyFeatures.id,
        propertyId: propertyFeatures.propertyId,
      })
      .from(propertyFeatures);
  });

  results.push({
    name: "Tenant A sees only own property_features",
    passed:
      tenantAFeatureRows.length === 2 &&
      tenantAFeatureRows.every((row) =>
        tenantAPropertyIds.includes(row.propertyId),
      ),
    detail: `expected 2 property_features for tenant A, got ${tenantAFeatureRows.length}`,
  });

  const tenantBFeatureRows = await withTenantContext(tenantB.id, async (tx) => {
    return tx
      .select({
        id: propertyFeatures.id,
        propertyId: propertyFeatures.propertyId,
      })
      .from(propertyFeatures);
  });

  results.push({
    name: "Tenant B sees only own property_features",
    passed:
      tenantBFeatureRows.length === 2 &&
      tenantBFeatureRows.every((row) =>
        tenantBPropertyIds.includes(row.propertyId),
      ),
    detail: `expected 2 property_features for tenant B, got ${tenantBFeatureRows.length}`,
  });

  const noContextFeatureRows = await appDb
    .select({ id: propertyFeatures.id })
    .from(propertyFeatures);

  results.push({
    name: "No tenant context returns zero property_features",
    passed: noContextFeatureRows.length === 0,
    detail: `expected 0 property_features without app.current_tenant, got ${noContextFeatureRows.length}`,
  });

  const crossTenantFeatureRows = await withTenantContext(tenantA.id, async (tx) => {
    return tx
      .select({ id: propertyFeatures.id })
      .from(propertyFeatures)
      .where(eq(propertyFeatures.propertyId, tenantBPropertyIds[0] ?? ""));
  });

  results.push({
    name: "Tenant A cannot read tenant B property_features by property_id",
    passed: crossTenantFeatureRows.length === 0,
    detail: `expected 0 cross-tenant property_features, got ${crossTenantFeatureRows.length}`,
  });

  const tenantAImageRows = await withTenantContext(tenantA.id, async (tx) => {
    return tx
      .select({
        id: propertyImages.id,
        propertyId: propertyImages.propertyId,
      })
      .from(propertyImages);
  });

  results.push({
    name: "Tenant A sees only own property_images",
    passed:
      tenantAImageRows.length === 2 &&
      tenantAImageRows.every((row) => tenantAPropertyIds.includes(row.propertyId)),
    detail: `expected 2 property_images for tenant A, got ${tenantAImageRows.length}`,
  });

  const tenantBImageRows = await withTenantContext(tenantB.id, async (tx) => {
    return tx
      .select({
        id: propertyImages.id,
        propertyId: propertyImages.propertyId,
      })
      .from(propertyImages);
  });

  results.push({
    name: "Tenant B sees only own property_images",
    passed:
      tenantBImageRows.length === 2 &&
      tenantBImageRows.every((row) => tenantBPropertyIds.includes(row.propertyId)),
    detail: `expected 2 property_images for tenant B, got ${tenantBImageRows.length}`,
  });

  const noContextImageRows = await appDb
    .select({ id: propertyImages.id })
    .from(propertyImages);

  results.push({
    name: "No tenant context returns zero property_images",
    passed: noContextImageRows.length === 0,
    detail: `expected 0 property_images without app.current_tenant, got ${noContextImageRows.length}`,
  });

  const crossTenantImageRows = await withTenantContext(tenantA.id, async (tx) => {
    return tx
      .select({ id: propertyImages.id })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, tenantBPropertyIds[0] ?? ""));
  });

  results.push({
    name: "Tenant A cannot read tenant B property_images by property_id",
    passed: crossTenantImageRows.length === 0,
    detail: `expected 0 cross-tenant property_images, got ${crossTenantImageRows.length}`,
  });

  const tenantBFeaturesBeforeCrossInsert = await withTenantContext(
    tenantB.id,
    async (tx) => {
      return tx.select({ id: propertyFeatures.id }).from(propertyFeatures);
    },
  );

  let crossFeatureInsertBlocked = false;

  try {
    await withTenantContext(tenantA.id, async (tx) => {
      await tx.insert(propertyFeatures).values({
        propertyId: tenantBPropertyIds[0] ?? "",
        featureKey: "garage",
        featureValue: "2-car",
      });
    });
  } catch {
    crossFeatureInsertBlocked = true;
  }

  const tenantBFeaturesAfterCrossInsert = await withTenantContext(
    tenantB.id,
    async (tx) => {
      return tx.select({ id: propertyFeatures.id }).from(propertyFeatures);
    },
  );

  results.push({
    name: "Tenant A cannot insert property_features for tenant B property",
    passed:
      crossFeatureInsertBlocked ||
      tenantBFeaturesAfterCrossInsert.length ===
        tenantBFeaturesBeforeCrossInsert.length,
    detail: crossFeatureInsertBlocked
      ? "insert rejected by RLS"
      : `feature count unchanged (${tenantBFeaturesBeforeCrossInsert.length})`,
  });

  const tenantBImagesBeforeCrossInsert = await withTenantContext(
    tenantB.id,
    async (tx) => {
      return tx.select({ id: propertyImages.id }).from(propertyImages);
    },
  );

  let crossImageInsertBlocked = false;

  try {
    await withTenantContext(tenantA.id, async (tx) => {
      await tx.insert(propertyImages).values({
        propertyId: tenantBPropertyIds[0] ?? "",
        storageKey: `tenants/${tenantB.id}/cross-tenant.jpg`,
      });
    });
  } catch {
    crossImageInsertBlocked = true;
  }

  const tenantBImagesAfterCrossInsert = await withTenantContext(
    tenantB.id,
    async (tx) => {
      return tx.select({ id: propertyImages.id }).from(propertyImages);
    },
  );

  results.push({
    name: "Tenant A cannot insert property_images for tenant B property",
    passed:
      crossImageInsertBlocked ||
      tenantBImagesAfterCrossInsert.length === tenantBImagesBeforeCrossInsert.length,
    detail: crossImageInsertBlocked
      ? "insert rejected by RLS"
      : `image count unchanged (${tenantBImagesBeforeCrossInsert.length})`,
  });

  const failed = results.filter((result) => !result.passed);

  console.log(
    "\nRLS POC — test_items + audit_logs + properties + property_features + property_images isolation (propai_app role)\n",
  );

  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`[${status}] ${result.name} — ${result.detail}`);
  }

  console.log("");

  if (failed.length > 0) {
    process.exitCode = 1;
    throw new Error(`${failed.length} RLS POC test(s) failed`);
  }

  console.log("All RLS POC checks passed.\n");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
