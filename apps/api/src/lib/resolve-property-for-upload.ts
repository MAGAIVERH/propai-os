import { properties, runInTenantContext } from "@propai/db";
import type { BrokerageRole } from "@propai/shared";
import { eq } from "drizzle-orm";

import { assertPropertyAccess } from "./property-access.js";

const uploadPropertySelectFields = {
  id: properties.id,
  tenantId: properties.tenantId,
  createdBy: properties.createdBy,
  softDeletedAt: properties.softDeletedAt,
} as const;

export type UploadPropertyRecord = {
  id: string;
  tenantId: string;
  createdBy: string | null;
  softDeletedAt: Date | null;
};

export async function resolvePropertyForUpload(
  tenantId: string,
  propertyId: string,
  role: BrokerageRole,
  userId: string,
): Promise<UploadPropertyRecord | null> {
  const rows = await runInTenantContext(tenantId, async (tx) => {
    return tx
      .select(uploadPropertySelectFields)
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
  });

  const property = rows[0];
  const access = assertPropertyAccess(role, userId, property);

  if (!access.allowed || !property) {
    return null;
  }

  return property;
}
