import {
  AI_ANALYZE_IMAGES_QUEUE_NAME,
  analyzeImagesJobDataSchema,
  type AnalyzeImagesJobData,
} from "@propai/shared";
import { Worker, type ConnectionOptions, type Job } from "bullmq";

import {
  BullMqRedisUnavailableError,
  getBullMqDuplicateConnection,
} from "../../../lib/redis-bullmq.js";
import { analyzePropertyImages } from "../analyze-property-images-service.js";

export const ANALYZE_PROPERTY_IMAGES_WORKER_CONCURRENCY = 1;

let cachedWorker: Worker<AnalyzeImagesJobData> | null = null;

export async function processAnalyzePropertyImagesJob(
  job: Job<AnalyzeImagesJobData>,
): Promise<unknown> {
  const parsed = analyzeImagesJobDataSchema.parse(job.data);

  return analyzePropertyImages(parsed.imageUrls);
}

export function createAnalyzePropertyImagesWorker(): Worker<AnalyzeImagesJobData> {
  const connection = getBullMqDuplicateConnection();

  if (!connection) {
    throw new BullMqRedisUnavailableError();
  }

  if (cachedWorker) {
    return cachedWorker;
  }

  cachedWorker = new Worker<AnalyzeImagesJobData>(
    AI_ANALYZE_IMAGES_QUEUE_NAME,
    processAnalyzePropertyImagesJob,
    {
      connection: connection as ConnectionOptions,
      concurrency: ANALYZE_PROPERTY_IMAGES_WORKER_CONCURRENCY,
    },
  );

  return cachedWorker;
}

/** Closes the worker singleton — for tests and graceful shutdown. */
export async function closeAnalyzePropertyImagesWorker(): Promise<void> {
  if (!cachedWorker) {
    return;
  }

  await cachedWorker.close();
  cachedWorker = null;
}

/** Resets the in-memory singleton without connecting — for tests only. */
export function resetAnalyzePropertyImagesWorkerCache(): void {
  cachedWorker = null;
}
