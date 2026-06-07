import type { PropertyResponse } from "@propai/shared";

export type PropertyRow = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: PropertyResponse["type"];
  status: PropertyResponse["status"];
  priceUsdCents: number;
  rentOrSale: PropertyResponse["rentOrSale"];
  bedrooms: number;
  bathrooms: string;
  sqFt: number;
  yearBuilt: number | null;
  hoaFeeUsd: number | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  latitude: string | null;
  longitude: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  softDeletedAt: Date | null;
};

function numericToNullableNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

export function mapPropertyRow(row: PropertyRow): PropertyResponse {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    priceUsdCents: row.priceUsdCents,
    rentOrSale: row.rentOrSale,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms.toString(),
    sqFt: row.sqFt,
    yearBuilt: row.yearBuilt,
    hoaFeeUsd: row.hoaFeeUsd,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    latitude: numericToNullableNumber(row.latitude),
    longitude: numericToNullableNumber(row.longitude),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    softDeletedAt: row.softDeletedAt?.toISOString() ?? null,
  };
}
