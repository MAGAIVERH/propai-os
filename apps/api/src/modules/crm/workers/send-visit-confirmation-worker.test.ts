import type { SendVisitConfirmationJobData } from "@propai/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRunInTenantContext,
  mockGetResendClient,
  mockGetResendFromEmail,
  mockResendSend,
  mockWriteAuditEventSafe,
  mockGetBullMqDuplicateConnection,
  MockWorker,
  mockWorkerConstructor,
} = vi.hoisted(() => {
  const mockRunInTenantContext = vi.fn();
  const mockGetResendClient = vi.fn();
  const mockGetResendFromEmail = vi.fn(() => "notifications@propai-os.com");
  const mockResendSend = vi.fn();
  const mockWriteAuditEventSafe = vi.fn();
  const mockWorkerClose = vi.fn();
  const mockGetBullMqDuplicateConnection = vi.fn();
  const mockWorkerConstructor = vi.fn();

  class MockWorker {
    close = mockWorkerClose;

    constructor(queueName: string, processor: unknown, options: unknown) {
      mockWorkerConstructor(queueName, processor, options);
    }
  }

  return {
    mockRunInTenantContext,
    mockGetResendClient,
    mockGetResendFromEmail,
    mockResendSend,
    mockWriteAuditEventSafe,
    mockWorkerClose,
    mockGetBullMqDuplicateConnection,
    MockWorker,
    mockWorkerConstructor,
  };
});

vi.mock("bullmq", () => ({
  Worker: MockWorker,
}));

vi.mock("@propai/db", () => ({
  leads: {
    id: "id",
    email: "email",
    firstName: "firstName",
    lastName: "lastName",
    softDeletedAt: "softDeletedAt",
  },
  properties: {
    id: "id",
    addressLine1: "addressLine1",
    addressLine2: "addressLine2",
    city: "city",
    state: "state",
    zipCode: "zipCode",
    softDeletedAt: "softDeletedAt",
  },
  runInTenantContext: mockRunInTenantContext,
}));

vi.mock("../../../lib/redis-bullmq.js", () => ({
  BullMqRedisUnavailableError: class BullMqRedisUnavailableError extends Error {
    constructor(message = "BullMQ Redis is not configured or unavailable.") {
      super(message);
      this.name = "BullMqRedisUnavailableError";
    }
  },
  getBullMqDuplicateConnection: mockGetBullMqDuplicateConnection,
}));

vi.mock("../../../lib/resend-client.js", () => ({
  getResendClient: mockGetResendClient,
  getResendFromEmail: mockGetResendFromEmail,
}));

vi.mock("../../../lib/write-audit-event.js", () => ({
  writeAuditEventSafe: mockWriteAuditEventSafe,
}));

import { VISITS_SEND_CONFIRMATION_QUEUE_NAME } from "@propai/shared";
import {
  closeSendVisitConfirmationWorker,
  createSendVisitConfirmationWorker,
  processSendVisitConfirmationJob,
  resetSendVisitConfirmationWorkerCache,
  SEND_VISIT_CONFIRMATION_WORKER_CONCURRENCY,
} from "./send-visit-confirmation-worker.js";

const jobData: SendVisitConfirmationJobData = {
  tenantId: "550e8400-e29b-41d4-a716-446655440000",
  leadId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  propertyId: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  scheduledAt: "2026-07-01T20:00:00.000Z",
  timezone: "America/Chicago",
};

const recipient = {
  email: "buyer@example.com",
  firstName: "Jordan",
  lastName: "Smith",
  softDeletedAt: null,
};

const property = {
  addressLine1: "123 Maple St",
  addressLine2: null,
  city: "Austin",
  state: "TX",
  zipCode: "78701",
  softDeletedAt: null,
};

function buildJob(
  overrides: { attemptsMade?: number; attempts?: number } = {},
) {
  return {
    id: "job-1",
    data: jobData,
    attemptsMade: overrides.attemptsMade ?? 0,
    opts: { attempts: overrides.attempts ?? 3 },
  } as unknown as Parameters<typeof processSendVisitConfirmationJob>[0];
}

function mockTenantLoad() {
  // First call selects the lead, second selects the property.
  mockRunInTenantContext.mockImplementation(async (_tenantId, fn) => {
    const tx = {
      select: () => ({
        from: (table: { __t?: string }) => ({
          where: () => ({
            limit: () =>
              Promise.resolve(
                table === leadsRef ? [recipient] : [property],
              ),
          }),
        }),
      }),
    };
    return fn(tx);
  });
}

// Resolve the mocked table identities the worker imports.
let leadsRef: unknown;
beforeEach(async () => {
  const db = await import("@propai/db");
  leadsRef = db.leads;
});

describe("processSendVisitConfirmationJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetResendFromEmail.mockReturnValue("notifications@propai-os.com");
  });

  it("skips when Resend is not configured", async () => {
    mockGetResendClient.mockReturnValue(null);

    await processSendVisitConfirmationJob(buildJob());

    expect(mockRunInTenantContext).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("skips when the lead is unavailable", async () => {
    mockGetResendClient.mockReturnValue({ emails: { send: mockResendSend } });
    mockRunInTenantContext.mockImplementation(async (_tenantId, fn) =>
      fn({
        select: () => ({
          from: () => ({
            where: () => ({ limit: () => Promise.resolve([]) }),
          }),
        }),
      }),
    );

    await processSendVisitConfirmationJob(buildJob());

    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("sends the confirmation email when configured and recipient present", async () => {
    mockGetResendClient.mockReturnValue({ emails: { send: mockResendSend } });
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
    mockTenantLoad();

    await processSendVisitConfirmationJob(buildJob());

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const payload = mockResendSend.mock.calls[0]![0] as {
      to: string;
      subject: string;
      from: string;
    };
    expect(payload.to).toBe("buyer@example.com");
    expect(payload.from).toBe("notifications@propai-os.com");
    expect(payload.subject).toContain("123 Maple St, Austin, TX 78701");
    expect(mockWriteAuditEventSafe).not.toHaveBeenCalled();
  });

  it("logs an audit failure on the final attempt and rethrows", async () => {
    mockGetResendClient.mockReturnValue({ emails: { send: mockResendSend } });
    mockResendSend.mockResolvedValue({
      data: null,
      error: { message: "Resend rejected" },
    });
    mockTenantLoad();

    await expect(
      processSendVisitConfirmationJob(buildJob({ attemptsMade: 2, attempts: 3 })),
    ).rejects.toThrow("Resend rejected");

    expect(mockWriteAuditEventSafe).toHaveBeenCalledTimes(1);
    const event = mockWriteAuditEventSafe.mock.calls[0]![0] as {
      action: string;
      entityId: string;
    };
    expect(event.action).toBe("visit.confirmation_failed");
    expect(event.entityId).toBe(jobData.leadId);
  });

  it("does not log audit on a non-final failed attempt but still rethrows", async () => {
    mockGetResendClient.mockReturnValue({ emails: { send: mockResendSend } });
    mockResendSend.mockRejectedValue(new Error("network"));
    mockTenantLoad();

    await expect(
      processSendVisitConfirmationJob(buildJob({ attemptsMade: 0, attempts: 3 })),
    ).rejects.toThrow("network");

    expect(mockWriteAuditEventSafe).not.toHaveBeenCalled();
  });
});

describe("createSendVisitConfirmationWorker", () => {
  beforeEach(() => {
    resetSendVisitConfirmationWorkerCache();
    vi.clearAllMocks();
    mockWorkerConstructor.mockClear();
  });

  afterEach(async () => {
    await closeSendVisitConfirmationWorker();
    resetSendVisitConfirmationWorkerCache();
  });

  it("throws when BullMQ Redis is not configured", () => {
    mockGetBullMqDuplicateConnection.mockReturnValue(null);

    expect(() => createSendVisitConfirmationWorker()).toThrow(
      "BullMQ Redis is not configured or unavailable.",
    );
  });

  it("creates a singleton worker on the visits-send-confirmation queue", () => {
    const connection = { id: "duplicate-connection" };
    mockGetBullMqDuplicateConnection.mockReturnValue(connection);

    const first = createSendVisitConfirmationWorker();
    const second = createSendVisitConfirmationWorker();

    expect(first).toBe(second);
    expect(mockWorkerConstructor).toHaveBeenCalledTimes(1);
    expect(mockWorkerConstructor).toHaveBeenCalledWith(
      VISITS_SEND_CONFIRMATION_QUEUE_NAME,
      processSendVisitConfirmationJob,
      {
        connection,
        concurrency: SEND_VISIT_CONFIRMATION_WORKER_CONCURRENCY,
      },
    );
  });
});
