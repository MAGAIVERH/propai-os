import { describe, expect, it } from "vitest";

import {
  scheduleVisitSchema,
  sendVisitConfirmationJobDataSchema,
  VISITS_SEND_CONFIRMATION_QUEUE_NAME,
} from "./visit.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
const leadId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const propertyId = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

describe("scheduleVisitSchema", () => {
  it("accepts a UTC instant with an IANA timezone", () => {
    const parsed = scheduleVisitSchema.parse({
      scheduledAt: "2026-07-01T15:00:00.000Z",
      timezone: "America/Chicago",
    });

    expect(parsed.timezone).toBe("America/Chicago");
    expect(parsed.propertyId).toBeUndefined();
  });

  it("rejects a non-ISO scheduledAt", () => {
    expect(() =>
      scheduleVisitSchema.parse({
        scheduledAt: "next tuesday",
        timezone: "America/Chicago",
      }),
    ).toThrow();
  });

  it("rejects an empty timezone", () => {
    expect(() =>
      scheduleVisitSchema.parse({
        scheduledAt: "2026-07-01T15:00:00.000Z",
        timezone: "   ",
      }),
    ).toThrow();
  });
});

describe("sendVisitConfirmationJobDataSchema", () => {
  it("validates a full job payload", () => {
    const parsed = sendVisitConfirmationJobDataSchema.parse({
      tenantId,
      leadId,
      propertyId,
      scheduledAt: "2026-07-01T15:00:00.000Z",
      timezone: "America/New_York",
    });

    expect(parsed.leadId).toBe(leadId);
  });

  it("exposes the queue name constant", () => {
    expect(VISITS_SEND_CONFIRMATION_QUEUE_NAME).toBe("visits-send-confirmation");
    // BullMQ v5 rejects ":" in queue names.
    expect(VISITS_SEND_CONFIRMATION_QUEUE_NAME).not.toContain(":");
  });
});
