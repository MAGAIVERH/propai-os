import {
  sendVisitConfirmationJobDataSchema,
  VISITS_SEND_CONFIRMATION_JOB_NAME,
  VISITS_SEND_CONFIRMATION_QUEUE_NAME,
  type SendVisitConfirmationJobData,
} from "@propai/shared";
import { Queue, type ConnectionOptions } from "bullmq";

import {
  BullMqRedisUnavailableError,
  getBullMqConnection,
} from "../../../lib/redis-bullmq.js";

export const VISITS_SEND_CONFIRMATION_JOB_ATTEMPTS = 3;
export const VISITS_SEND_CONFIRMATION_JOB_BACKOFF_DELAY_MS = 5_000;

let cachedQueue: Queue<SendVisitConfirmationJobData> | null = null;

export function getSendVisitConfirmationQueue(): Queue<SendVisitConfirmationJobData> | null {
  const connection = getBullMqConnection();

  if (!connection) {
    return null;
  }

  if (!cachedQueue) {
    cachedQueue = new Queue<SendVisitConfirmationJobData>(
      VISITS_SEND_CONFIRMATION_QUEUE_NAME,
      {
        connection: connection as ConnectionOptions,
        defaultJobOptions: {
          attempts: VISITS_SEND_CONFIRMATION_JOB_ATTEMPTS,
          backoff: {
            type: "exponential",
            delay: VISITS_SEND_CONFIRMATION_JOB_BACKOFF_DELAY_MS,
          },
          removeOnComplete: true,
        },
      },
    );
  }

  return cachedQueue;
}

export function requireSendVisitConfirmationQueue(): Queue<SendVisitConfirmationJobData> {
  const queue = getSendVisitConfirmationQueue();

  if (!queue) {
    throw new BullMqRedisUnavailableError();
  }

  return queue;
}

export async function enqueueSendVisitConfirmationJob(
  data: SendVisitConfirmationJobData,
): Promise<string> {
  const parsed = sendVisitConfirmationJobDataSchema.parse(data);
  const queue = requireSendVisitConfirmationQueue();
  const job = await queue.add(VISITS_SEND_CONFIRMATION_JOB_NAME, parsed);

  if (!job.id) {
    throw new Error("BullMQ did not return a job id.");
  }

  return job.id;
}

/** Closes the queue singleton — for tests and graceful shutdown. */
export async function closeSendVisitConfirmationQueue(): Promise<void> {
  if (!cachedQueue) {
    return;
  }

  await cachedQueue.close();
  cachedQueue = null;
}

/** Resets the in-memory singleton without connecting — for tests only. */
export function resetSendVisitConfirmationQueueCache(): void {
  cachedQueue = null;
}
