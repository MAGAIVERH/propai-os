import { sql } from "drizzle-orm";

import { closeDb, getAppDb, getDb } from "../src/client.js";
import { organization, testItems } from "../src/schema/index.js";
import { withTenantContext } from "../src/tenant-context.js";

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
    sql`TRUNCATE test_items, tenant_settings, member, invitation, organization, "user" RESTART IDENTITY CASCADE`,
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

  const failed = results.filter((result) => !result.passed);

  console.log("\nRLS POC — test_items isolation (propai_app role)\n");

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
