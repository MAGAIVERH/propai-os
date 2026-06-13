import { z } from "zod";

import {
  propertyStatusSchema,
  propertyTypeSchema,
  rentOrSaleSchema,
} from "../properties/property.js";

export const semanticSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(500),
  tenantId: z.uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  beds: z.coerce.number().int().min(0).optional(),
  city: z.string().trim().min(1).optional(),
  state: z
    .string()
    .length(2)
    .regex(/^[A-Za-z]{2}$/, "State must be a 2-letter US code")
    .transform((v) => v.toUpperCase())
    .optional(),
  minPriceUsdCents: z.coerce.number().int().min(0).optional(),
  maxPriceUsdCents: z.coerce.number().int().min(0).optional(),
  type: propertyTypeSchema.optional(),
  rentOrSale: rentOrSaleSchema.optional(),
});

export type SemanticSearchQuery = z.infer<typeof semanticSearchQuerySchema>;

export const semanticSearchResultItemSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  type: propertyTypeSchema,
  status: propertyStatusSchema,
  priceUsdCents: z.number().int(),
  rentOrSale: rentOrSaleSchema,
  bedrooms: z.number().int(),
  bathrooms: z.string(),
  sqFt: z.number().int(),
  yearBuilt: z.number().int().nullable(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  relevanceScore: z.number().min(0).max(1),
});

export type SemanticSearchResultItem = z.infer<typeof semanticSearchResultItemSchema>;

export const semanticSearchResponseSchema = z.object({
  items: z.array(semanticSearchResultItemSchema),
  query: z.string(),
  total: z.number().int(),
});

export type SemanticSearchResponse = z.infer<typeof semanticSearchResponseSchema>;
