import { getDb } from "@propai/db";
import { sql } from "drizzle-orm";

export async function pingDatabase(): Promise<boolean> {
  try {
    await getDb().execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
