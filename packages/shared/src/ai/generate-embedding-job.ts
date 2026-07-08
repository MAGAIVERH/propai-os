import { z } from "zod";

// BullMQ v5 forbids ":" in queue names (it's the Redis key separator), so use hyphens.
export const AI_GENERATE_EMBEDDING_QUEUE_NAME = "ai-generate-embedding";

export const generateEmbeddingJobDataSchema = z.object({
  tenantId: z.uuid(),
  propertyId: z.uuid(),
});

export type GenerateEmbeddingJobData = z.infer<typeof generateEmbeddingJobDataSchema>;
