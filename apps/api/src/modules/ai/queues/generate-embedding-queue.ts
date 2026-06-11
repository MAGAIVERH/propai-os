import {
  AI_GENERATE_EMBEDDING_QUEUE_NAME,
  generateEmbeddingJobDataSchema,
  type GenerateEmbeddingJobData,
} from "@propai/shared";
import { Queue, type ConnectionOptions } from "bullmq";

import {
  BullMqRedisUnavailableError,
  getBullMqConnection,
} from "../../../lib/redis-bullmq.js";

export const AI_GENERATE_EMBEDDING_JOB_ATTEMPTS = 3;
export const AI_GENERATE_EMBEDDING_JOB_BACKOFF_DELAY_MS = 1_000;
export const AI_GENERATE_EMBEDDING_JOB_NAME = "generate";

let cachedQueue: Queue<GenerateEmbeddingJobData> | null = null;

export function getGenerateEmbeddingQueue(): Queue<GenerateEmbeddingJobData> | null {
  const connection = getBullMqConnection();

  if (!connection) {
    return null;
  }

  if (!cachedQueue) {
    cachedQueue = new Queue<GenerateEmbeddingJobData>(
      AI_GENERATE_EMBEDDING_QUEUE_NAME,
      {
        connection: connection as ConnectionOptions,
        defaultJobOptions: {
          attempts: AI_GENERATE_EMBEDDING_JOB_ATTEMPTS,
          backoff: {
            type: "exponential",
            delay: AI_GENERATE_EMBEDDING_JOB_BACKOFF_DELAY_MS,
          },
        },
      },
    );
  }

  return cachedQueue;
}

export function requireGenerateEmbeddingQueue(): Queue<GenerateEmbeddingJobData> {
  const queue = getGenerateEmbeddingQueue();

  if (!queue) {
    throw new BullMqRedisUnavailableError();
  }

  return queue;
}

export async function enqueueGenerateEmbeddingJob(
  data: GenerateEmbeddingJobData,
): Promise<string> {
  const parsed = generateEmbeddingJobDataSchema.parse(data);
  const queue = requireGenerateEmbeddingQueue();
  const job = await queue.add(AI_GENERATE_EMBEDDING_JOB_NAME, parsed);

  if (!job.id) {
    throw new Error("BullMQ did not return a job id.");
  }

  return job.id;
}

/** Closes the queue singleton — for tests and graceful shutdown. */
export async function closeGenerateEmbeddingQueue(): Promise<void> {
  if (!cachedQueue) {
    return;
  }

  await cachedQueue.close();
  cachedQueue = null;
}

/** Resets the in-memory singleton without connecting — for tests only. */
export function resetGenerateEmbeddingQueueCache(): void {
  cachedQueue = null;
}
