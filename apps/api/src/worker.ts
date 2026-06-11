import { closeAnalyzeImagesQueue } from "./modules/ai/queues/analyze-images-queue.js";
import {
  closeAnalyzePropertyImagesWorker,
  createAnalyzePropertyImagesWorker,
} from "./modules/ai/workers/analyze-property-images-worker.js";
import { closeBullMqConnections } from "./lib/redis-bullmq.js";

async function shutdown(signal: string): Promise<void> {
  console.info({ signal }, "worker shutting down");

  await closeAnalyzePropertyImagesWorker();
  await closeAnalyzeImagesQueue();
  await closeBullMqConnections();

  process.exit(0);
}

async function startWorker(): Promise<void> {
  const worker = createAnalyzePropertyImagesWorker();

  worker.on("ready", () => {
    console.info("analyze-property-images worker ready");
  });

  worker.on("completed", (job) => {
    console.info({ jobId: job.id }, "analyze-property-images job completed");
  });

  worker.on("failed", (job, error) => {
    console.error(
      { jobId: job?.id, err: error.message },
      "analyze-property-images job failed",
    );
  });

  worker.on("error", (error) => {
    console.error({ err: error.message }, "analyze-property-images worker error");
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
