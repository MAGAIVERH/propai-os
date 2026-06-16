import { EventEmitter } from "node:events";

import type { RealtimeEvent } from "@propai/shared";

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

function tenantChannel(tenantId: string): string {
  return `tenant:${tenantId}`;
}

/** Broadcasts an event to every connection subscribed to this tenant. */
export function publishTenantEvent(tenantId: string, event: RealtimeEvent): void {
  emitter.emit(tenantChannel(tenantId), event);
}

/** Subscribes to a tenant's events. Returns an unsubscribe function. */
export function subscribeTenantEvents(
  tenantId: string,
  listener: (event: RealtimeEvent) => void,
): () => void {
  const channel = tenantChannel(tenantId);
  emitter.on(channel, listener);

  return () => emitter.off(channel, listener);
}
