import { z } from "zod";

export const UPLOAD_MAX_BYTES = 10_485_760;

const IMAGE_CONTENT_TYPE_PREFIX = "image/";

export function isImageContentType(contentType: string): boolean {
  return contentType.toLowerCase().startsWith(IMAGE_CONTENT_TYPE_PREFIX);
}

export const presignUploadRequestSchema = z.object({
  propertyId: z.uuid(),
  contentType: z.string().min(1).refine(isImageContentType, "Content-Type must be image/*"),
  contentLength: z.number().int().min(1).max(UPLOAD_MAX_BYTES),
});

export type PresignUploadRequest = z.infer<typeof presignUploadRequestSchema>;

export const presignUploadResponseSchema = z.object({
  uploadUrl: z.url(),
  key: z.string().min(1),
  expiresAt: z.iso.datetime(),
  headers: z.record(z.string(), z.string()),
});

export type PresignUploadResponse = z.infer<typeof presignUploadResponseSchema>;

export const presignDownloadQuerySchema = z.object({
  key: z.string().min(1).max(512),
});

export type PresignDownloadQuery = z.infer<typeof presignDownloadQuerySchema>;

export const presignDownloadResponseSchema = z.object({
  downloadUrl: z.url(),
  expiresAt: z.iso.datetime(),
});

export type PresignDownloadResponse = z.infer<typeof presignDownloadResponseSchema>;
