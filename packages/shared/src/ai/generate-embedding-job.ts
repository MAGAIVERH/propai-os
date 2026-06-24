import { z } from "zod";

export const AI_GENERATE_EMBEDDING_QUEUE_NAME = "ai:generate-embedding";

export const generateEmbeddingJobDataSchema = z.object({
  tenantId: z.uuid(),
  propertyId: z.uuid(),
});

export type GenerateEmbeddingJobData = z.infer<typeof generateEmbeddingJobDataSchema>;
