import { z } from "zod";

export const PROPERTY_TYPES = [
  "single_family",
  "condo",
  "townhouse",
  "multi_family",
] as const;

export const propertyTypeSchema = z.enum(PROPERTY_TYPES);

export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const PROPERTY_STATUSES = [
  "draft",
  "active",
  "under_contract",
  "sold",
  "rented",
] as const;

export const propertyStatusSchema = z.enum(PROPERTY_STATUSES);

export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

export const RENT_OR_SALE_VALUES = ["sale", "rent"] as const;

export const rentOrSaleSchema = z.enum(RENT_OR_SALE_VALUES);

export type RentOrSale = z.infer<typeof rentOrSaleSchema>;

const usStateCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Za-z]{2}$/, "State must be a 2-letter US code")
  .transform((value) => value.toUpperCase());

const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "ZIP must be 5 digits or ZIP+4");

const bathroomsSchema = z
  .string()
  .regex(/^\d+(\.5)?$/, "Bathrooms must be a whole number or end in .5");

const currentYear = new Date().getFullYear();

export const createPropertySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().optional(),
  type: propertyTypeSchema,
  status: propertyStatusSchema.optional(),
  priceUsdCents: z.number().int().positive(),
  rentOrSale: rentOrSaleSchema,
  bedrooms: z.number().int().min(0),
  bathrooms: bathroomsSchema,
  sqFt: z.number().int().positive(),
  yearBuilt: z
    .number()
    .int()
    .min(1800)
    .max(currentYear + 1)
    .optional(),
  hoaFeeUsd: z.number().int().min(0).optional(),
  addressLine1: z.string().trim().min(1),
  addressLine2: z.string().optional(),
  city: z.string().trim().min(1),
  state: usStateCodeSchema,
  zipCode: zipCodeSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = createPropertySchema.partial();

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const propertyResponseSchema = z.object({
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
  hoaFeeUsd: z.number().int().nullable(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  softDeletedAt: z.iso.datetime().nullable(),
});

export type PropertyResponse = z.infer<typeof propertyResponseSchema>;

export const propertyListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).optional(),
  status: propertyStatusSchema.optional(),
  type: propertyTypeSchema.optional(),
  city: z.string().min(1).optional(),
  state: usStateCodeSchema.optional(),
  minPriceUsdCents: z.coerce.number().int().min(0).optional(),
  maxPriceUsdCents: z.coerce.number().int().min(0).optional(),
});

export type PropertyListQuery = z.infer<typeof propertyListQuerySchema>;

export const propertyListResponseSchema = z.object({
  items: z.array(propertyResponseSchema),
  nextCursor: z.string().nullable(),
});

export type PropertyListResponse = z.infer<typeof propertyListResponseSchema>;

export const propertyCreateResponseSchema = z.object({
  property: propertyResponseSchema,
});

export type PropertyCreateResponse = z.infer<typeof propertyCreateResponseSchema>;
