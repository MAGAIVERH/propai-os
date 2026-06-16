"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { realtimeEventSchema, type RealtimeEvent } from "@propai/shared";

import { getWsUrl } from "@/lib/env";

import { LEADS_QUERY_KEY } from "./use-kanban";

const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

export type TenantSocketStatus = "connecting" | "open" | "closed";

function handleEvent(
  event: RealtimeEvent,
  invalidateLeads: () => void,
  invalidateActivities: (leadId: string) => void,
): void {
  switch (event.type) {
    case "lead:created":
      toast.success(`New lead: ${event.lead.firstName} ${event.lead.lastName}`);
      invalidateLeads();
      break;
    case "lead:updated":
    case "lead:moved":
    case "lead:deleted":
      invalidateLeads();
      break;
    case "activity:created":
      invalidateActivities(event.activity.leadId);
      break;
  }
}

/** Subscribes the dashboard to live CRM events for the active tenant. */
export function useTenantSocket(): { status: TenantSocketStatus } {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TenantSocketStatus>("connecting");

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoffMs = INITIAL_BACKOFF_MS;
    let stopped = false;

    const invalidateLeads = () => {
      void queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    };

    const invalidateActivities = (leadId: string) => {
      void queryClient.invalidateQueries({
        queryKey: ["lead-activities", leadId],
      });
    };

    const connect = () => {
      if (stopped) return;

      setStatus("connecting");
      socket = new WebSocket(`${getWsUrl()}/v1/realtime`);

      socket.addEventListener("open", () => {
        backoffMs = INITIAL_BACKOFF_MS;
        setStatus("open");
      });

      socket.addEventListener("message", (messageEvent) => {
        let parsedJson: unknown;

        try {
          parsedJson = JSON.parse(messageEvent.data as string);
        } catch {
          return;
        }

        const parsed = realtimeEventSchema.safeParse(parsedJson);

        if (parsed.success) {
          handleEvent(parsed.data, invalidateLeads, invalidateActivities);
        }
      });

      socket.addEventListener("close", () => {
        setStatus("closed");

        if (stopped) return;

        reconnectTimer = setTimeout(connect, backoffMs);
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      });

      socket.addEventListener("error", () => {
        socket?.close();
      });
    };

    connect();

    return () => {
      stopped = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      socket?.close();
    };
  }, [queryClient]);

  return { status };
}
