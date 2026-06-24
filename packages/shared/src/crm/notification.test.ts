import { describe, expect, it } from "vitest";

import {
  notificationListQuerySchema,
  notificationListResponseSchema,
  notificationResponseSchema,
} from "./notification.js";
import { realtimeEventSchema } from "./lead-events.js";

const base = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  tenantId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  userId: "user_123",
  type: "lead_created" as const,
  title: "New lead",
  body: "Jordan Smith is interested in 123 Maple St",
  leadId: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  readAt: null,
  createdAt: "2026-06-19T19:00:00.000Z",
};

describe("notificationResponseSchema", () => {
  it("accepts a valid notification with null readAt", () => {
    expect(notificationResponseSchema.parse(base).readAt).toBeNull();
  });

  it("rejects an unknown type", () => {
    expect(() => notificationResponseSchema.parse({ ...base, type: "spam" })).toThrow();
  });
});

describe("notificationListQuerySchema", () => {
  it("coerces unreadOnly and defaults limit", () => {
    const parsed = notificationListQuerySchema.parse({ unreadOnly: "true" });
    expect(parsed.unreadOnly).toBe(true);
    expect(parsed.limit).toBe(20);
  });
});

describe("notificationListResponseSchema", () => {
  it("validates list + unreadCount", () => {
    const parsed = notificationListResponseSchema.parse({
      notifications: [base],
      unreadCount: 1,
    });
    expect(parsed.unreadCount).toBe(1);
  });
});

describe("realtimeEventSchema notification:created", () => {
  it("parses a notification:created event", () => {
    const parsed = realtimeEventSchema.parse({
      type: "notification:created",
      tenantId: base.tenantId,
      timestamp: "2026-06-19T19:00:00.000Z",
      notification: base,
    });
    expect(parsed.type).toBe("notification:created");
  });
});
