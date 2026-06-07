import { z } from "zod";

import { isImageContentType, UPLOAD_MAX_BYTES } from "../uploads/presign.js";

export const imageConfirmRequestSchema = z.object({
  objectKey: z.string().min(1).max(512),
  mimeType: z
    .string()
    .min(1)
    .refine(isImageContentType, "Content-Type must be image/*"),
  sizeBytes: z.number().int().min(1).max(UPLOAD_MAX_BYTES),
  sortOrder: z.number().int().min(0).optional(),
});

export type ImageConfirmRequest = z.infer<typeof imageConfirmRequestSchema>;

export const propertyImageResponseSchema = z.object({
  id: z.uuid(),
  propertyId: z.uuid(),
  storageKey: z.string().min(1),
  sortOrder: z.number().int(),
  isPrimary: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type PropertyImageResponse = z.infer<typeof propertyImageResponseSchema>;

export const imageConfirmResponseSchema = z.object({
  image: propertyImageResponseSchema,
});

export type ImageConfirmResponse = z.infer<typeof imageConfirmResponseSchema>;
