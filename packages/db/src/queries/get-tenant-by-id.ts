import { eq } from "drizzle-orm";

import { getDb } from "../client.js";
import { tenants } from "../schema/tenants.js";

/** Returns `tenants.id` when the row exists (used for org → tenant mapping). */
export async function getTenantById(tenantId: string): Promise<string | null> {
  const [tenant] = await getDb()
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return tenant?.id ?? null;
}
