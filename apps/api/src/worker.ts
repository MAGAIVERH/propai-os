import { closeAnalyzeImagesQueue } from "./modules/ai/queues/analyze-images-queue.js";
import { closeGenerateEmbeddingQueue } from "./modules/ai/queues/generate-embedding-queue.js";
import {
  closeAnalyzePropertyImagesWorker,
  createAnalyzePropertyImagesWorker,
} from "./modules/ai/workers/analyze-property-images-worker.js";
import {
  closeGeneratePropertyEmbeddingWorker,
  createGeneratePropertyEmbeddingWorker,
} from "./modules/ai/workers/generate-property-embedding-worker.js";
import { closeSendVisitConfirmationQueue } from "./modules/crm/queues/send-visit-confirmation-queue.js";
import {
  closeSendVisitConfirmationWorker,
  createSendVisitConfirmationWorker,
} from "./modules/crm/workers/send-visit-confirmation-worker.js";
import { closeBullMqConnections } from "./lib/redis-bullmq.js";

async function shutdown(signal: string): Promise<void> {
  console.info({ signal }, "worker shutting down");

  await Promise.all([
    closeAnalyzePropertyImagesWorker(),
    closeGeneratePropertyEmbeddingWorker(),
    closeSendVisitConfirmationWorker(),
    closeAnalyzeImagesQueue(),
    closeGenerateEmbeddingQueue(),
    closeSendVisitConfirmationQueue(),
    closeBullMqConnections(),
  ]);

  process.exit(0);
}

async function startWorker(): Promise<void> {
  const analyzeImagesWorker = createAnalyzePropertyImagesWorker();
  const generateEmbeddingWorker = createGeneratePropertyEmbeddingWorker();
  const sendVisitConfirmationWorker = createSendVisitConfirmationWorker();

  analyzeImagesWorker.on("ready", () => {
    console.info("analyze-property-images worker ready");
  });

  analyzeImagesWorker.on("completed", (job) => {
    console.info({ jobId: job.id }, "analyze-property-images job completed");
  });

  analyzeImagesWorker.on("failed", (job, error) => {
    console.error(
      { jobId: job?.id, err: error.message },
      "analyze-property-images job failed",
    );
  });

  analyzeImagesWorker.on("error", (error) => {
    console.error({ err: error.message }, "analyze-property-images worker error");
  });

  generateEmbeddingWorker.on("ready", () => {
    console.info("generate-property-embedding worker ready");
  });

  generateEmbeddingWorker.on("completed", (job) => {
    console.info({ jobId: job.id }, "generate-property-embedding job completed");
  });

  generateEmbeddingWorker.on("failed", (job, error) => {
    console.error(
      { jobId: job?.id, err: error.message },
      "generate-property-embedding job failed",
    );
  });

  generateEmbeddingWorker.on("error", (error) => {
    console.error({ err: error.message }, "generate-property-embedding worker error");
  });

  sendVisitConfirmationWorker.on("ready", () => {
    console.info("send-visit-confirmation worker ready");
  });

  sendVisitConfirmationWorker.on("completed", (job) => {
    console.info({ jobId: job.id }, "send-visit-confirmation job completed");
  });

  sendVisitConfirmationWorker.on("failed", (job, error) => {
    console.error(
      { jobId: job?.id, err: error.message },
      "send-visit-confirmation job failed",
    );
  });

  sendVisitConfirmationWorker.on("error", (error) => {
    console.error({ err: error.message }, "send-visit-confirmation worker error");
  });

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

startWorker().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
