import type { SendVisitConfirmationJobData } from "@propai/shared";

import { enqueueSendVisitConfirmationJob } from "./queues/send-visit-confirmation-queue.js";

/**
 * Best-effort enqueue of the visit confirmation email job (Day 44).
 * Never throws: a missing BullMQ connection must not fail the schedule request.
 */
export async function enqueueVisitConfirmationJobSafe(
  data: SendVisitConfirmationJobData,
): Promise<void> {
  try {
    await enqueueSendVisitConfirmationJob(data);
  } catch (error) {
    console.error(
      {
        tenantId: data.tenantId,
        leadId: data.leadId,
        err: error instanceof Error ? error.message : String(error),
      },
      "Failed to enqueue visit confirmation job",
    );
  }
}
