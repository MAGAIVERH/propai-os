import {
  properties,
  propertyFeatures,
  runInTenantContext,
} from "@propai/db";
import {
  AI_GENERATE_EMBEDDING_QUEUE_NAME,
  generateEmbeddingJobDataSchema,
  type GenerateEmbeddingJobData,
} from "@propai/shared";
import { eq } from "drizzle-orm";
import { Worker, type ConnectionOptions, type Job } from "bullmq";

import {
  BullMqRedisUnavailableError,
  getBullMqDuplicateConnection,
} from "../../../lib/redis-bullmq.js";
import { buildPropertyEmbeddingText } from "../build-property-embedding-text.js";
import { generatePropertyEmbedding } from "../generate-property-embedding.js";

export const GENERATE_PROPERTY_EMBEDDING_WORKER_CONCURRENCY = 1;

export type PropertyEmbeddingSource = {
  title: string;
  description: string | null;
  features: { featureKey: string; featureValue: string }[];
};

let cachedWorker: Worker<GenerateEmbeddingJobData> | null = null;

export async function loadPropertyEmbeddingSource(
  tenantId: string,
  propertyId: string,
): Promise<PropertyEmbeddingSource | null> {
  return runInTenantContext(tenantId, async (tx) => {
    const propertyRows = await tx
      .select({
        title: properties.title,
        description: properties.description,
        status: properties.status,
        softDeletedAt: properties.softDeletedAt,
      })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    const property = propertyRows[0];

    if (!property || property.status !== "active" || property.softDeletedAt) {
      return null;
    }

    const features = await tx
      .select({
        featureKey: propertyFeatures.featureKey,
        featureValue: propertyFeatures.featureValue,
      })
      .from(propertyFeatures)
      .where(eq(propertyFeatures.propertyId, propertyId));

    return {
      title: property.title,
      description: property.description,
      features,
    };
  });
}

export async function persistPropertyEmbedding(
  tenantId: string,
  propertyId: string,
  embedding: number[],
): Promise<void> {
  const embeddingUpdatedAt = new Date();

  await runInTenantContext(tenantId, async (tx) => {
    await tx
      .update(properties)
      .set({
        embedding,
        embeddingUpdatedAt,
      })
      .where(eq(properties.id, propertyId));
  });
}

export async function processGeneratePropertyEmbeddingJob(
  job: Job<GenerateEmbeddingJobData>,
): Promise<void> {
  const { tenantId, propertyId } = generateEmbeddingJobDataSchema.parse(job.data);

  const source = await loadPropertyEmbeddingSource(tenantId, propertyId);

  if (!source) {
    return;
  }

  const text = buildPropertyEmbeddingText(source);
  const embedding = await generatePropertyEmbedding(text);

  await persistPropertyEmbedding(tenantId, propertyId, embedding);
}

export function createGeneratePropertyEmbeddingWorker(): Worker<GenerateEmbeddingJobData> {
  const connection = getBullMqDuplicateConnection();

  if (!connection) {
    throw new BullMqRedisUnavailableError();
  }

  if (cachedWorker) {
    return cachedWorker;
  }

  cachedWorker = new Worker<GenerateEmbeddingJobData>(
    AI_GENERATE_EMBEDDING_QUEUE_NAME,
    processGeneratePropertyEmbeddingJob,
    {
      connection: connection as ConnectionOptions,
      concurrency: GENERATE_PROPERTY_EMBEDDING_WORKER_CONCURRENCY,
    },
  );

  return cachedWorker;
}

/** Closes the worker singleton — for tests and graceful shutdown. */
export async function closeGeneratePropertyEmbeddingWorker(): Promise<void> {
  if (!cachedWorker) {
    return;
  }

  await cachedWorker.close();
  cachedWorker = null;
}

/** Resets the in-memory singleton without connecting — for tests only. */
export function resetGeneratePropertyEmbeddingWorkerCache(): void {
  cachedWorker = null;
}
