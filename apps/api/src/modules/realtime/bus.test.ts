import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { publishTenantEvent, subscribeTenantEvents } from "./bus.js";

function fakeEvent(tenantId: string) {
  return {
    type: "lead:created" as const,
    tenantId,
    timestamp: new Date().toISOString(),
    lead: {
      id: randomUUID(),
      tenantId,
      firstName: "Test",
      lastName: "Lead",
      email: "test@example.com",
      phone: null,
      source: null,
      assignedAgentId: null,
      propertyId: null,
      stageId: null,
      aiScore: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

describe("realtime bus", () => {
  it("delivers a published event to a subscriber on the same tenant", () => {
    const tenantId = randomUUID();
    const received: unknown[] = [];

    const unsubscribe = subscribeTenantEvents(tenantId, (event) => {
      received.push(event);
    });

    const event = fakeEvent(tenantId);
    publishTenantEvent(tenantId, event);

    expect(received).toEqual([event]);
    unsubscribe();
  });

  it("does not deliver events across tenants", () => {
    const tenantA = randomUUID();
    const tenantB = randomUUID();
    const received: unknown[] = [];

    const unsubscribe = subscribeTenantEvents(tenantB, (event) => {
      received.push(event);
    });

    publishTenantEvent(tenantA, fakeEvent(tenantA));

    expect(received).toEqual([]);
    unsubscribe();
  });

  it("stops delivering events after unsubscribe", () => {
    const tenantId = randomUUID();
    const received: unknown[] = [];

    const unsubscribe = subscribeTenantEvents(tenantId, (event) => {
      received.push(event);
    });

    unsubscribe();
    publishTenantEvent(tenantId, fakeEvent(tenantId));

    expect(received).toEqual([]);
  });
});
