import { z } from "zod";

import {
  propertyTypeSchema,
  rentOrSaleSchema,
} from "../properties/property.js";

export const publicPropertyQuerySchema = z.object({
  tenantId: z.uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  rentOrSale: rentOrSaleSchema.optional(),
  type: propertyTypeSchema.optional(),
  city: z.string().min(1).optional(),
  state: z
    .string()
    .length(2)
    .transform((v) => v.toUpperCase())
    .optional(),
  minPriceUsdCents: z.coerce.number().int().min(0).optional(),
  maxPriceUsdCents: z.coerce.number().int().min(0).optional(),
  beds: z.coerce.number().int().min(0).optional(),
});

export type PublicPropertyQuery = z.infer<typeof publicPropertyQuerySchema>;

export const submitInterestSchema = z.object({
  tenantId: z.uuid(),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().trim().optional(),
  message: z.string().trim().optional(),
  propertyId: z.uuid().optional(),
});

export type SubmitInterestInput = z.infer<typeof submitInterestSchema>;

export const submitInterestResponseSchema = z.object({
  leadId: z.uuid(),
});

export type SubmitInterestResponse = z.infer<typeof submitInterestResponseSchema>;
