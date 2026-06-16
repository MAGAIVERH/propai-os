import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";

import type { LeadResponse, RealtimeEvent } from "@propai/shared";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

type LeadSingleResponse = { lead: LeadResponse };

let runningApp: Awaited<ReturnType<typeof buildApp>> | null = null;

afterEach(async () => {
  await runningApp?.close();
  runningApp = null;
});

async function startApp(): Promise<{ app: Awaited<ReturnType<typeof buildApp>>; wsUrl: string }> {
  const app = await buildApp();
  await app.listen({ port: 0, host: "127.0.0.1" });
  runningApp = app;

  const { port } = app.server.address() as AddressInfo;

  return { app, wsUrl: `ws://127.0.0.1:${port}/v1/realtime` };
}

async function signUpBrokerageOwner(
  app: Awaited<ReturnType<typeof buildApp>>,
): Promise<{ cookie: string; orgId: string }> {
  const suffix = randomUUID().slice(0, 8);

  const response = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    payload: {
      email: `realtime-owner-${suffix}@test.propai-os.local`,
      password: "password123",
      name: "Realtime Owner",
      organizationName: `Realtime Brokerage ${suffix}`,
    },
  });

  expect(response.statusCode).toBe(201);

  const body = response.json() as BrokerageSignUpResponse;
  const cookie = normalizeCookieHeader(response.headers["set-cookie"]) ?? "";

  return { cookie, orgId: body.organization.id };
}

function waitForOutcome(socket: WebSocket): Promise<
  | { type: "open" }
  | { type: "rejected"; statusCode: number }
> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for WebSocket outcome."));
    }, 5000);

    socket.once("open", () => {
      clearTimeout(timeout);
      resolve({ type: "open" });
    });

    socket.once("unexpected-response", (_req, res) => {
      clearTimeout(timeout);
      resolve({ type: "rejected", statusCode: res.statusCode ?? 0 });
    });

    socket.once("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function waitForMessage(socket: WebSocket): Promise<RealtimeEvent> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for realtime message."));
    }, 5000);

    socket.once("message", (data) => {
      clearTimeout(timeout);
      resolve(JSON.parse(data.toString()) as RealtimeEvent);
    });
  });
}

describe("Day 43 — realtime WebSocket updates", () => {
  it("rejects the upgrade without a valid session cookie", async () => {
    const { wsUrl } = await startApp();

    const socket = new WebSocket(wsUrl);
    const outcome = await waitForOutcome(socket);

    expect(outcome).toEqual({ type: "rejected", statusCode: 401 });
  });

  it("delivers a lead:created event to a connected tenant socket", async () => {
    const { app, wsUrl } = await startApp();
    const { cookie } = await signUpBrokerageOwner(app);

    const socket = new WebSocket(wsUrl, { headers: { cookie } });
    const outcome = await waitForOutcome(socket);

    expect(outcome).toEqual({ type: "open" });

    const messagePromise = waitForMessage(socket);

    const createLeadResponse = await app.inject({
      method: "POST",
      url: "/v1/leads",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        firstName: "Realtime",
        lastName: "Lead",
        email: `realtime-lead-${randomUUID().slice(0, 8)}@example.com`,
      },
    });

    expect(createLeadResponse.statusCode).toBe(201);

    const createdLead = (createLeadResponse.json() as LeadSingleResponse).lead;
    const event = await messagePromise;

    expect(event.type).toBe("lead:created");

    if (event.type === "lead:created") {
      expect(event.lead.id).toBe(createdLead.id);
    }

    socket.close();
  });
});
