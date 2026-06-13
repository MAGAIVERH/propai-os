import { z } from "zod";

import { propertyTypeSchema, rentOrSaleSchema } from "../properties/property.js";

export const estimatePriceRequestSchema = z.object({
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  type: propertyTypeSchema,
  bedrooms: z.number().int().min(0),
  sqFt: z.number().positive(),
  rentOrSale: rentOrSaleSchema,
  excludePropertyId: z.uuid().optional(),
});

export type EstimatePriceRequest = z.infer<typeof estimatePriceRequestSchema>;

export const estimatePriceResponseSchema = z.object({
  minUsd: z.number().positive(),
  maxUsd: z.number().positive(),
  midpointUsd: z.number().positive(),
  reasoning: z.string(),
  comparablesCount: z.number().int().min(0),
});

export type EstimatePriceResponse = z.infer<typeof estimatePriceResponseSchema>;

export const MOCK_PRICE_ESTIMATE = {
  minUsd: 430000,
  maxUsd: 510000,
  midpointUsd: 470000,
  reasoning:
    "Based on 4 comparable active listings in the same market, the estimated range is $430K–$510K. Properties of similar size and bedroom count have been selling within this band.",
  comparablesCount: 4,
} satisfies EstimatePriceResponse;
