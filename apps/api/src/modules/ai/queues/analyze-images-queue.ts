import {
  AI_ANALYZE_IMAGES_QUEUE_NAME,
  analyzeImagesJobDataSchema,
  type AnalyzeImagesJobData,
} from "@propai/shared";
import { Queue, type ConnectionOptions } from "bullmq";

import {
  BullMqRedisUnavailableError,
  getBullMqConnection,
} from "../../../lib/redis-bullmq.js";

export const AI_ANALYZE_IMAGES_JOB_ATTEMPTS = 3;
export const AI_ANALYZE_IMAGES_JOB_BACKOFF_DELAY_MS = 1_000;
export const AI_ANALYZE_IMAGES_JOB_NAME = "analyze";

let cachedQueue: Queue<AnalyzeImagesJobData> | null = null;

export function getAnalyzeImagesQueue(): Queue<AnalyzeImagesJobData> | null {
  const connection = getBullMqConnection();

  if (!connection) {
    return null;
  }

  if (!cachedQueue) {
    cachedQueue = new Queue<AnalyzeImagesJobData>(AI_ANALYZE_IMAGES_QUEUE_NAME, {
      connection: connection as ConnectionOptions,
      defaultJobOptions: {
        attempts: AI_ANALYZE_IMAGES_JOB_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: AI_ANALYZE_IMAGES_JOB_BACKOFF_DELAY_MS,
        },
      },
    });
  }

  return cachedQueue;
}

export function requireAnalyzeImagesQueue(): Queue<AnalyzeImagesJobData> {
  const queue = getAnalyzeImagesQueue();

  if (!queue) {
    throw new BullMqRedisUnavailableError();
  }

  return queue;
}

export async function enqueueAnalyzeImagesJob(
  data: AnalyzeImagesJobData,
): Promise<string> {
  const parsed = analyzeImagesJobDataSchema.parse(data);
  const queue = requireAnalyzeImagesQueue();
  const job = await queue.add(AI_ANALYZE_IMAGES_JOB_NAME, parsed);

  if (!job.id) {
    throw new Error("BullMQ did not return a job id.");
  }

  return job.id;
}

/** Closes the queue singleton — for tests and graceful shutdown. */
export async function closeAnalyzeImagesQueue(): Promise<void> {
  if (!cachedQueue) {
    return;
  }

  await cachedQueue.close();
  cachedQueue = null;
}

/** Resets the in-memory singleton without connecting — for tests only. */
export function resetAnalyzeImagesQueueCache(): void {
  cachedQueue = null;
}
