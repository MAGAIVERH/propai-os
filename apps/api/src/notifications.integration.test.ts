import { randomUUID } from "node:crypto";

import type { NotificationListResponse } from "@propai/shared";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

describe("Day 45 — in-app notifications integration", () => {
  it("marketplace lead → notification → mark read loop", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `notif-owner-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "Notif Owner",
        organizationName: `Notif Brokerage ${suffix}`,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const signUpBody = signUpResponse.json() as BrokerageSignUpResponse;
    const cookie = normalizeCookieHeader(signUpResponse.headers["set-cookie"]) ?? "";
    const tenantId = signUpBody.organization.id;

    // Inbound marketplace lead (public, unauthenticated) → notifies members.
    const interestResponse = await app.inject({
      method: "POST",
      url: "/public/interest",
      headers: { "content-type": "application/json" },
      payload: {
        tenantId,
        firstName: "Jordan",
        lastName: "Smith",
        email: `jordan-${suffix}@example.com`,
        message: "I love this place",
      },
    });

    expect(interestResponse.statusCode).toBe(201);

    // Owner sees one unread notification.
    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/notifications",
      headers: { cookie },
    });

    expect(listResponse.statusCode).toBe(200);

    const listBody = listResponse.json() as NotificationListResponse;

    expect(listBody.unreadCount).toBe(1);
    expect(listBody.notifications).toHaveLength(1);
    expect(listBody.notifications[0]?.type).toBe("lead_created");
    expect(listBody.notifications[0]?.readAt).toBeNull();

    const notificationId = listBody.notifications[0]!.id;

    // Mark it read.
    const readResponse = await app.inject({
      method: "PATCH",
      url: `/v1/notifications/${notificationId}/read`,
      headers: { cookie },
    });

    expect(readResponse.statusCode).toBe(200);

    // Unread count is now zero.
    const afterRead = await app.inject({
      method: "GET",
      url: "/v1/notifications",
      headers: { cookie },
    });

    const afterReadBody = afterRead.json() as NotificationListResponse;

    expect(afterReadBody.unreadCount).toBe(0);

    await app.close();
  });
});
