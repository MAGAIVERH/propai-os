import { isSemanticSearchEnabled } from "../../lib/ai-feature-flags.js";
import { enqueueGenerateEmbeddingJob } from "./queues/generate-embedding-queue.js";

export async function enqueuePropertyEmbeddingJobIfEnabled(
  tenantId: string,
  propertyId: string,
): Promise<void> {
  if (!isSemanticSearchEnabled()) {
    return;
  }

  try {
    await enqueueGenerateEmbeddingJob({ tenantId, propertyId });
  } catch (error) {
    console.error(
      {
        tenantId,
        propertyId,
        err: error instanceof Error ? error.message : String(error),
      },
      "Failed to enqueue property embedding job",
    );
  }
}
