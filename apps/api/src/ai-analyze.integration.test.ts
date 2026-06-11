import { randomUUID } from "node:crypto";

import {
  MOCK_PROPERTY_IMAGE_ANALYSIS,
  propertyImageAnalysisSchema,
  type PropertyImageAnalysis,
} from "@propai/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { clearDevInvitations } from "./lib/invitation-dev-store.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

type InvitationCreateResponse = {
  invitation: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
};

type AppInstance = Awaited<ReturnType<typeof buildApp>>;

type SignedUpUser = {
  userId: string;
  organizationId: string;
  cookie: string;
};

const analyzePayload = {
  imageUrls: ["https://example.com/photo.jpg"],
} as const;

const originalEnv = { ...process.env };

async function brokerageSignUp(
  app: AppInstance,
  suffix: string,
  label: string,
): Promise<SignedUpUser> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    payload: {
      email: `ai-${label}-${suffix}@test.propai-os.local`,
      password: "password123",
      name: `AI Owner ${label}`,
      organizationName: `AI Brokerage ${label} ${suffix}`,
    },
  });

  expect(response.statusCode).toBe(201);

  const body = response.json() as BrokerageSignUpResponse;
  const cookie = normalizeCookieHeader(response.headers["set-cookie"]);

  expect(cookie).toBeDefined();
  expect(body.session.activeOrganizationId).toBe(body.organization.id);

  return {
    userId: body.user.id,
    organizationId: body.organization.id,
    cookie: cookie ?? "",
  };
}

async function inviteAndAcceptUser(
  app: AppInstance,
  ownerCookie: string,
  organizationId: string,
  role: "viewer",
  label: string,
  suffix: string,
): Promise<{ cookie: string }> {
  const email = `ai-${role}-${label}-${suffix}@test.propai-os.local`;

  const inviteResponse = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-invite",
    headers: {
      cookie: ownerCookie,
      "content-type": "application/json",
    },
    payload: { email, role },
  });

  expect(inviteResponse.statusCode).toBe(201);

  const inviteBody = inviteResponse.json() as InvitationCreateResponse;

  expect(inviteBody.invitation.organizationId).toBe(organizationId);
  expect(inviteBody.invitation.role).toBe(role);

  const signUpResponse = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: {
      email,
      password: "password123",
      name: `AI ${role} ${label}`,
    },
  });

  expect(signUpResponse.statusCode).toBe(200);

  const signUpCookie = normalizeCookieHeader(signUpResponse.headers["set-cookie"]);

  expect(signUpCookie).toBeDefined();

  const acceptResponse = await app.inject({
    method: "POST",
    url: "/api/auth/organization/accept-invitation",
    headers: {
      cookie: signUpCookie ?? "",
      "content-type": "application/json",
    },
    payload: { invitationId: inviteBody.invitation.id },
  });

  expect(acceptResponse.statusCode).toBe(200);

  const sessionCookie =
    normalizeCookieHeader(acceptResponse.headers["set-cookie"]) ?? signUpCookie;

  return { cookie: sessionCookie ?? "" };
}

describe("Day 26 — AI analyze property images integration", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ENABLE_AI_VISION = "false";
    clearDevInvitations();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 401 for unauthenticated POST /v1/ai/analyze-property-images", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: { "content-type": "application/json" },
      payload: analyzePayload,
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it("returns 403 for viewer role on analyze endpoint", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "viewer-deny");
    const viewer = await inviteAndAcceptUser(
      app,
      owner.cookie,
      owner.organizationId,
      "viewer",
      "deny",
      suffix,
    );

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: {
        cookie: viewer.cookie,
        "content-type": "application/json",
      },
      payload: analyzePayload,
    });

    expect(response.statusCode).toBe(403);

    await app.close();
  });

  it("returns mock analysis when ENABLE_AI_VISION is false", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "mock");

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: analyzePayload,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as PropertyImageAnalysis;
    const parsed = propertyImageAnalysisSchema.parse(body);

    expect(parsed.bedrooms).toBe(MOCK_PROPERTY_IMAGE_ANALYSIS.bedrooms);
    expect(parsed.bathrooms).toBe(MOCK_PROPERTY_IMAGE_ANALYSIS.bathrooms);
    expect(parsed.sqFt).toBe(MOCK_PROPERTY_IMAGE_ANALYSIS.sqFt);
    expect(parsed.features).toEqual(MOCK_PROPERTY_IMAGE_ANALYSIS.features);
    expect(parsed.description).toBe(MOCK_PROPERTY_IMAGE_ANALYSIS.description);
    expect(parsed.seoTitle).toBe(MOCK_PROPERTY_IMAGE_ANALYSIS.seoTitle);
    expect(parsed.suggestedPriceUSD).toBe(
      MOCK_PROPERTY_IMAGE_ANALYSIS.suggestedPriceUSD,
    );

    await app.close();
  });

  it("returns 503 when ENABLE_AI_VISION is true", async () => {
    process.env.ENABLE_AI_VISION = "true";

    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);
    const owner = await brokerageSignUp(app, suffix, "flag-on");

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: {
        cookie: owner.cookie,
        "content-type": "application/json",
      },
      payload: analyzePayload,
    });

    expect(response.statusCode).toBe(503);

    const body = response.json() as { error: string; message: string };

    expect(body.message).toBe("AI vision is not implemented yet");

    await app.close();
  });
});
