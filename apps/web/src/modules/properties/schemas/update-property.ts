import { type UpdatePropertyInput } from "@propai/shared";
import { z } from "zod";

import {
  createPropertyFormSchema,
  type CreatePropertyFormValues,
} from "@/modules/properties/schemas/create-property";

export const updatePropertyFormSchema = createPropertyFormSchema.partial();

export type UpdatePropertyFormValues = z.infer<typeof updatePropertyFormSchema>;

export function toUpdatePropertyPayload(
  values: UpdatePropertyFormValues,
): UpdatePropertyInput {
  const { priceUsd, ...rest } = values;
  const payload: UpdatePropertyInput = { ...rest };

  if (priceUsd !== undefined) {
    payload.priceUsdCents = Math.round(priceUsd * 100);
  }

  return payload;
}

export function mapPropertyToFormValues(property: {
  title: string;
  description?: string | null;
  type: CreatePropertyFormValues["type"];
  status: CreatePropertyFormValues["status"];
  priceUsdCents: number;
  rentOrSale: CreatePropertyFormValues["rentOrSale"];
  bedrooms: number;
  bathrooms: string;
  sqFt: number;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
}): CreatePropertyFormValues {
  return {
    title: property.title,
    description: property.description ?? "",
    type: property.type,
    status: property.status,
    priceUsd: property.priceUsdCents / 100,
    rentOrSale: property.rentOrSale,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqFt: property.sqFt,
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2 ?? "",
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
  };
}
