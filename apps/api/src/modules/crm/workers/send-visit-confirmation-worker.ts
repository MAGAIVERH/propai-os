import { leads, properties, runInTenantContext } from "@propai/db";
import {
  sendVisitConfirmationJobDataSchema,
  VISITS_SEND_CONFIRMATION_QUEUE_NAME,
  type SendVisitConfirmationJobData,
} from "@propai/shared";
import { eq } from "drizzle-orm";
import { Worker, type ConnectionOptions, type Job } from "bullmq";

import {
  BullMqRedisUnavailableError,
  getBullMqDuplicateConnection,
} from "../../../lib/redis-bullmq.js";
import {
  getResendClient,
  getResendFromEmail,
} from "../../../lib/resend-client.js";
import { writeAuditEventSafe } from "../../../lib/write-audit-event.js";
import {
  buildVisitConfirmationEmail,
  type VisitConfirmationEmailInput,
} from "../visit-confirmation-email.js";
import { VISITS_SEND_CONFIRMATION_JOB_ATTEMPTS } from "../queues/send-visit-confirmation-queue.js";

export const SEND_VISIT_CONFIRMATION_WORKER_CONCURRENCY = 5;

export type VisitConfirmationRecipient = {
  email: string;
  recipientName: string;
  address: string;
};

let cachedWorker: Worker<SendVisitConfirmationJobData> | null = null;

function formatAddress(row: {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
}): string {
  const line1 = row.addressLine2
    ? `${row.addressLine1}, ${row.addressLine2}`
    : row.addressLine1;

  return `${line1}, ${row.city}, ${row.state} ${row.zipCode}`;
}

/** Loads the lead recipient + property address required to render the email. */
export async function loadVisitConfirmationRecipient(
  tenantId: string,
  leadId: string,
  propertyId: string,
): Promise<VisitConfirmationRecipient | null> {
  return runInTenantContext(tenantId, async (tx) => {
    const leadRows = await tx
      .select({
        email: leads.email,
        firstName: leads.firstName,
        lastName: leads.lastName,
        softDeletedAt: leads.softDeletedAt,
      })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    const lead = leadRows[0];

    if (!lead || lead.softDeletedAt) {
      return null;
    }

    const propertyRows = await tx
      .select({
        addressLine1: properties.addressLine1,
        addressLine2: properties.addressLine2,
        city: properties.city,
        state: properties.state,
        zipCode: properties.zipCode,
        softDeletedAt: properties.softDeletedAt,
      })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    const property = propertyRows[0];

    if (!property || property.softDeletedAt) {
      return null;
    }

    return {
      email: lead.email,
      recipientName: `${lead.firstName} ${lead.lastName}`.trim(),
      address: formatAddress(property),
    };
  });
}

export async function processSendVisitConfirmationJob(
  job: Job<SendVisitConfirmationJobData>,
): Promise<void> {
  const data = sendVisitConfirmationJobDataSchema.parse(job.data);

  const resend = getResendClient();

  if (!resend) {
    console.warn(
      { jobId: job.id, tenantId: data.tenantId },
      "Skipping visit confirmation email: Resend is not configured",
    );
    return;
  }

  const recipient = await loadVisitConfirmationRecipient(
    data.tenantId,
    data.leadId,
    data.propertyId,
  );

  if (!recipient) {
    console.warn(
      { jobId: job.id, leadId: data.leadId, propertyId: data.propertyId },
      "Skipping visit confirmation email: lead or property unavailable",
    );
    return;
  }

  const emailInput: VisitConfirmationEmailInput = {
    recipientName: recipient.recipientName,
    address: recipient.address,
    scheduledAt: data.scheduledAt,
    timezone: data.timezone,
  };

  const email = buildVisitConfirmationEmail(emailInput);

  try {
    const result = await resend.emails.send({
      from: getResendFromEmail(),
      to: recipient.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const maxAttempts =
      job.opts.attempts ?? VISITS_SEND_CONFIRMATION_JOB_ATTEMPTS;
    const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

    if (isFinalAttempt) {
      await writeAuditEventSafe({
        tenantId: data.tenantId,
        actorId: null,
        action: "visit.confirmation_failed",
        entityType: "lead",
        entityId: data.leadId,
        metadata: {
          propertyId: data.propertyId,
          scheduledAt: data.scheduledAt,
          timezone: data.timezone,
          attempts: maxAttempts,
          error: message,
        },
      });
    }

    throw error;
  }
}

export function createSendVisitConfirmationWorker(): Worker<SendVisitConfirmationJobData> {
  const connection = getBullMqDuplicateConnection();

  if (!connection) {
    throw new BullMqRedisUnavailableError();
  }

  if (cachedWorker) {
    return cachedWorker;
  }

  cachedWorker = new Worker<SendVisitConfirmationJobData>(
    VISITS_SEND_CONFIRMATION_QUEUE_NAME,
    processSendVisitConfirmationJob,
    {
      connection: connection as ConnectionOptions,
      concurrency: SEND_VISIT_CONFIRMATION_WORKER_CONCURRENCY,
    },
  );

  return cachedWorker;
}

/** Closes the worker singleton — for tests and graceful shutdown. */
export async function closeSendVisitConfirmationWorker(): Promise<void> {
  if (!cachedWorker) {
    return;
  }

  await cachedWorker.close();
  cachedWorker = null;
}

/** Resets the in-memory singleton without connecting — for tests only. */
export function resetSendVisitConfirmationWorkerCache(): void {
  cachedWorker = null;
}
