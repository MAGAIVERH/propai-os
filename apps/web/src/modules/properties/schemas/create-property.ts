import {
  createPropertySchema,
  type CreatePropertyInput,
} from "@propai/shared";
import { z } from "zod";

export const createPropertyFormSchema = createPropertySchema
  .omit({ priceUsdCents: true })
  .extend({
    priceUsd: z
      .number({ error: "Enter a valid price." })
      .positive("Price must be greater than zero."),
  });

export type CreatePropertyFormValues = z.infer<typeof createPropertyFormSchema>;

export function toCreatePropertyPayload(
  values: CreatePropertyFormValues,
): CreatePropertyInput {
  const { priceUsd, ...rest } = values;

  return {
    ...rest,
    priceUsdCents: Math.round(priceUsd * 100),
  };
}

export const createPropertyFormDefaultValues: CreatePropertyFormValues = {
  title: "",
  description: "",
  type: "single_family",
  status: "draft",
  priceUsd: 0,
  rentOrSale: "sale",
  bedrooms: 0,
  bathrooms: "1",
  sqFt: 0,
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
};
