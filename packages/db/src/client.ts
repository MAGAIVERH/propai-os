import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl } from "./env.js";
import * as schema from "./schema/index.js";

export type Db = PostgresJsDatabase<typeof schema>;

let db: Db | undefined;
let sql: ReturnType<typeof postgres> | undefined;

/** Returns a singleton Drizzle client backed by postgres.js. */
export function getDb(): Db {
  if (db) {
    return db;
  }

  sql = postgres(getDatabaseUrl(), { max: 1 });
  db = drizzle(sql, { schema });
  return db;
}

/** Closes the postgres.js connection (useful in scripts and tests). */
export async function closeDb(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = undefined;
    db = undefined;
  }
}
