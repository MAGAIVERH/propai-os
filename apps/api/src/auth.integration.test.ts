import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

type SessionResponse = {
  session: {
    activeOrganizationId: string | null;
  } | null;
  user: { id: string; email: string } | null;
};

describe("Brokerage auth flow", () => {
  it("signs up, exposes activeOrganizationId, and accesses protected route", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const email = `owner-${suffix}@test.propai-os.local`;

    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email,
        password: "password123",
        name: "Test Owner",
        organizationName: `Test Brokerage ${suffix}`,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const signUpBody = signUpResponse.json() as BrokerageSignUpResponse;

    expect(signUpBody.session.activeOrganizationId).toBe(
      signUpBody.organization.id,
    );

    const cookieHeader = normalizeCookieHeader(signUpResponse.headers["set-cookie"]);

    expect(cookieHeader).toBeDefined();

    const sessionResponse = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
      headers: {
        cookie: cookieHeader ?? "",
      },
    });

    expect(sessionResponse.statusCode).toBe(200);

    const sessionBody = sessionResponse.json() as SessionResponse;

    expect(sessionBody.session?.activeOrganizationId).toBe(
      signUpBody.organization.id,
    );

    const itemsResponse = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: {
        cookie: cookieHeader ?? "",
      },
    });

    expect(itemsResponse.statusCode).toBe(200);
    expect(itemsResponse.json()).toMatchObject({ items: [] });

    await app.close();
  });

  it("signs in with email/password and returns session cookie", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const email = `login-${suffix}@test.propai-os.local`;
    const password = "password123";

    const signUpResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email,
        password,
        name: "Login Owner",
        organizationName: `Login Brokerage ${suffix}`,
      },
    });

    expect(signUpResponse.statusCode).toBe(201);

    const signInResponse = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      payload: {
        email,
        password,
        rememberMe: true,
      },
    });

    expect(signInResponse.statusCode).toBe(200);

    const cookieHeader = normalizeCookieHeader(signInResponse.headers["set-cookie"]);

    expect(cookieHeader).toBeDefined();

    const sessionResponse = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
      headers: {
        cookie: cookieHeader ?? "",
      },
    });

    const sessionBody = sessionResponse.json() as SessionResponse;

    expect(sessionBody.user?.email).toBe(email);
    expect(sessionBody.session?.activeOrganizationId).toBeTruthy();

    const itemsResponse = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: {
        cookie: cookieHeader ?? "",
      },
    });

    expect(itemsResponse.statusCode).toBe(200);

    await app.close();
  });

  it("returns 409 when organization slug is already taken", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const organizationName = `Conflict Brokerage ${suffix}`;

    const firstResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `first-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "First Owner",
        organizationName,
      },
    });

    expect(firstResponse.statusCode).toBe(201);

    const secondResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email: `second-${suffix}@test.propai-os.local`,
        password: "password123",
        name: "Second Owner",
        organizationName,
      },
    });

    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toMatchObject({
      error: "Conflict",
    });

    await app.close();
  });

  it("returns 409 when email is already registered", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const email = `duplicate-${suffix}@test.propai-os.local`;

    const firstResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email,
        password: "password123",
        name: "First Owner",
        organizationName: `First Brokerage ${suffix}`,
      },
    });

    expect(firstResponse.statusCode).toBe(201);

    const secondResponse = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-sign-up",
      payload: {
        email,
        password: "password123",
        name: "Second Owner",
        organizationName: `Second Brokerage ${suffix}`,
      },
    });

    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toMatchObject({
      error: "Conflict",
      message: "Email already registered.",
    });

    await app.close();
  });
});
