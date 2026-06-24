import { z } from "zod";

import {
  propertyResponseSchema,
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

/** A single gallery image for a public listing. URL is a fully-resolved public URL. */
export const publicPropertyImageSchema = z.object({
  id: z.uuid(),
  url: z.string(),
  isPrimary: z.boolean(),
  sortOrder: z.number().int(),
});

export type PublicPropertyImage = z.infer<typeof publicPropertyImageSchema>;

/** A key/value feature for a public listing (e.g. pool → yes). */
export const publicPropertyFeatureSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export type PublicPropertyFeature = z.infer<typeof publicPropertyFeatureSchema>;

/** Detail payload: the property plus its gallery and feature list. */
export const publicPropertyDetailResponseSchema = z.object({
  property: propertyResponseSchema,
  images: z.array(publicPropertyImageSchema),
  features: z.array(publicPropertyFeatureSchema),
});

export type PublicPropertyDetailResponse = z.infer<typeof publicPropertyDetailResponseSchema>;

/**
 * Public lead capture (marketplace → CRM). `website` is a honeypot field that
 * must stay empty; bots that fill it are silently dropped server-side.
 */
export const submitInterestSchema = z.object({
  tenantId: z.uuid(),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().trim().optional(),
  message: z.string().trim().optional(),
  propertyId: z.uuid().optional(),
  /**
   * Honeypot — leave empty. Real users never see this field. We accept any
   * string at the schema level and drop filled submissions in the handler, so
   * bots receive a normal-looking success response with no signal.
   */
  website: z.string().optional(),
});

export type SubmitInterestInput = z.infer<typeof submitInterestSchema>;

/** `/public/leads` is the canonical Day-49 endpoint; same shape as interest. */
export const submitPublicLeadSchema = submitInterestSchema;

export type SubmitPublicLeadInput = z.infer<typeof submitPublicLeadSchema>;

export const submitInterestResponseSchema = z.object({
  leadId: z.uuid(),
});

export type SubmitInterestResponse = z.infer<typeof submitInterestResponseSchema>;
