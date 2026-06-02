import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

import { getAppDb, type Db } from "./client.js";
import type * as schema from "./schema/index.js";

type DbSchema = typeof schema;

type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  DbSchema,
  ExtractTablesWithRelations<DbSchema>
>;

/**
 * Sets the tenant scope for the current transaction (`SET LOCAL` equivalent).
 * Used by PostgreSQL RLS policies on `test_items` and future business tables.
 */
export async function setTenantContext(
  executor: Db | DbTransaction,
  tenantId: string,
): Promise<void> {
  await executor.execute(
    sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`,
  );
}

/** Runs `fn` inside a transaction with `app.current_tenant` set for RLS. */
export async function withTenantContext<T>(
  tenantId: string,
  fn: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  const db = getAppDb();

  return db.transaction(async (tx) => {
    await setTenantContext(tx, tenantId);
    return fn(tx);
  });
}
