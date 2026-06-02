import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl, loadEnv } from "./env.js";
import * as schema from "./schema/index.js";

export type Db = PostgresJsDatabase<typeof schema>;

const DEFAULT_APP_DATABASE_URL =
  "postgresql://propai_app:propai_app@localhost:5432/propai";

let db: Db | undefined;
let sql: ReturnType<typeof postgres> | undefined;

let appDb: Db | undefined;
let appSql: ReturnType<typeof postgres> | undefined;

function createClient(connectionString: string): {
  db: Db;
  sql: ReturnType<typeof postgres>;
} {
  const client = postgres(connectionString, { max: 1 });
  return {
    sql: client,
    db: drizzle(client, { schema }),
  };
}

/** Returns a singleton Drizzle client backed by postgres.js (admin / migrations user). */
export function getDb(): Db {
  if (db) {
    return db;
  }

  const created = createClient(getDatabaseUrl());
  sql = created.sql;
  db = created.db;
  return db;
}

/**
 * Returns a Drizzle client for the non-superuser app role (RLS enforced).
 * Uses `DATABASE_APP_URL` or the local default `propai_app` role.
 */
export function getAppDb(): Db {
  if (appDb) {
    return appDb;
  }

  loadEnv();
  const configuredAppUrl = process.env.DATABASE_APP_URL?.trim();
  const connectionString =
    configuredAppUrl && configuredAppUrl.length > 0
      ? configuredAppUrl
      : DEFAULT_APP_DATABASE_URL;

  const created = createClient(connectionString);
  appSql = created.sql;
  appDb = created.db;
  return appDb;
}

/** Closes postgres.js connections (useful in scripts and tests). */
export async function closeDb(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = undefined;
    db = undefined;
  }

  if (appSql) {
    await appSql.end();
    appSql = undefined;
    appDb = undefined;
  }
}
