import { z } from "zod";

import { propertyImageAnalysisSchema } from "./property-image-analysis.js";

// BullMQ v5 forbids ":" in queue names (it's the Redis key separator), so use hyphens.
export const AI_ANALYZE_IMAGES_QUEUE_NAME = "ai-analyze-images";

export const AI_JOB_STATUSES = ["queued", "processing", "completed", "failed"] as const;

export const aiJobStatusSchema = z.enum(AI_JOB_STATUSES);

export type AiJobStatus = z.infer<typeof aiJobStatusSchema>;

export const analyzeImagesJobDataSchema = z.object({
  tenantId: z.uuid(),
  imageUrls: z.array(z.url()).min(1).max(10),
});

export type AnalyzeImagesJobData = z.infer<typeof analyzeImagesJobDataSchema>;

export const enqueueAnalyzeImagesJobResponseSchema = z.object({
  jobId: z.string().min(1),
});

export type EnqueueAnalyzeImagesJobResponse = z.infer<typeof enqueueAnalyzeImagesJobResponseSchema>;

export const analyzeImagesJobParamsSchema = z.object({
  jobId: z.string().min(1),
});

export type AnalyzeImagesJobParams = z.infer<typeof analyzeImagesJobParamsSchema>;

export const analyzeImagesJobStatusResponseSchema = z.object({
  jobId: z.string().min(1),
  status: aiJobStatusSchema,
  result: propertyImageAnalysisSchema.nullable().optional(),
  failedReason: z.string().nullable().optional(),
});

export type AnalyzeImagesJobStatusResponse = z.infer<typeof analyzeImagesJobStatusResponseSchema>;
