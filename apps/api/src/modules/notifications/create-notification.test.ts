import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRunInTenantContext, mockPublishTenantEvent } = vi.hoisted(() => ({
  mockRunInTenantContext: vi.fn(),
  mockPublishTenantEvent: vi.fn(),
}));

vi.mock("@propai/db", () => ({
  member: { userId: "user_id", organizationId: "organization_id" },
  notifications: {
    id: "id",
    tenantId: "tenant_id",
    userId: "user_id",
    type: "type",
    title: "title",
    body: "body",
    leadId: "lead_id",
    readAt: "read_at",
    createdAt: "created_at",
  },
  runInTenantContext: mockRunInTenantContext,
}));

vi.mock("../realtime/bus.js", () => ({
  publishTenantEvent: mockPublishTenantEvent,
}));

import { createNotifications } from "./create-notification.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";

function rowFor(userId: string) {
  return {
    id: `notif-${userId}`,
    tenantId,
    userId,
    type: "lead_created" as const,
    title: "New lead",
    body: "body",
    leadId: null,
    readAt: null,
    createdAt: new Date("2026-06-19T19:00:00.000Z"),
  };
}

describe("createNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("skips entirely when every recipient is excluded or empty", async () => {
    const result = await createNotifications({
      tenantId,
      userIds: ["actor", "actor", ""],
      type: "lead_created",
      title: "t",
      body: "b",
      excludeUserId: "actor",
    });

    expect(result).toEqual([]);
    expect(mockRunInTenantContext).not.toHaveBeenCalled();
    expect(mockPublishTenantEvent).not.toHaveBeenCalled();
  });

  it("dedupes recipients, excludes the actor, and publishes one event per row", async () => {
    mockRunInTenantContext.mockImplementation(async (_tenantId, fn) => {
      // Capture the values the route would insert by exercising the tx chain.
      const inserted: { userId: string }[] = [];
      const tx = {
        insert: () => ({
          values: (vals: { userId: string }[]) => {
            inserted.push(...vals);
            return {
              returning: () => Promise.resolve(vals.map((v) => rowFor(v.userId))),
            };
          },
        }),
      };
      return fn(tx);
    });

    const result = await createNotifications({
      tenantId,
      userIds: ["a", "a", "b", "actor"],
      type: "lead_created",
      title: "New lead",
      body: "body",
      excludeUserId: "actor",
    });

    expect(result.map((r) => r.userId)).toEqual(["a", "b"]);
    expect(mockPublishTenantEvent).toHaveBeenCalledTimes(2);
    expect(mockPublishTenantEvent).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ type: "notification:created" }),
    );
  });

  it("returns [] and does not throw when the insert fails", async () => {
    mockRunInTenantContext.mockRejectedValue(new Error("db down"));

    const result = await createNotifications({
      tenantId,
      userIds: ["a"],
      type: "lead_created",
      title: "t",
      body: "b",
    });

    expect(result).toEqual([]);
    expect(mockPublishTenantEvent).not.toHaveBeenCalled();
  });
});
