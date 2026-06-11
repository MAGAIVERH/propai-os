import {
  MOCK_PROPERTY_IMAGE_ANALYSIS,
  propertyImageAnalysisSchema,
  type PropertyImageAnalysis,
} from "@propai/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "./app.js";
import {
  checkAiVisionRateLimit,
  consumeAiVisionRateLimit,
} from "./lib/ai-vision-rate-limit.js";
import { resolveMemberAccess } from "./lib/member-access.js";
import { createMockSessionAuthorization } from "./modules/auth/session.js";
import { analyzePropertyImages } from "./modules/ai/analyze-property-images-service.js";

vi.mock("./modules/auth/resolve-tenant-id.js", () => ({
  resolveTenantId: vi.fn(
    async (session: { session: { activeOrganizationId: string | null } }) =>
      session.session.activeOrganizationId,
  ),
}));

vi.mock("./lib/member-access.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/member-access.js")>();

  return {
    ...actual,
    resolveMemberAccess: vi.fn(),
  };
});

vi.mock("./lib/ai-vision-rate-limit.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./lib/ai-vision-rate-limit.js")>();

  return {
    ...actual,
    checkAiVisionRateLimit: vi.fn(),
    consumeAiVisionRateLimit: vi.fn(),
  };
});

vi.mock("./modules/ai/analyze-property-images-service.js", () => ({
  analyzePropertyImages: vi.fn(),
}));

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
const propertyId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const fileId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const mockPayload = {
  imageUrls: ["https://example.com/photo.jpg"],
} as const;

const validPresignedUrl = `http://localhost:9000/propai-uploads/tenant/${tenantId}/property/${propertyId}/${fileId}.jpg?X-Amz-Signature=abc`;

const llmAnalysis: PropertyImageAnalysis = {
  bedrooms: 4,
  bathrooms: 2.5,
  sqFt: 2100,
  features: ["garage", "granite counters"],
  description: "Updated ranch with open living space and attached garage.",
  seoTitle: "4BR Ranch with Garage — Updated Kitchen",
  suggestedPriceUSD: 410_000,
};

const originalEnv = { ...process.env };

function setStorageEnv(): void {
  process.env.S3_ENDPOINT = "http://localhost:9000";
  process.env.S3_REGION = "us-east-1";
  process.env.S3_BUCKET = "propai-uploads";
  process.env.S3_ACCESS_KEY_ID = "minioadmin";
  process.env.S3_SECRET_ACCESS_KEY = "minioadmin";
}

function mockOwnerAccess(): void {
  vi.mocked(resolveMemberAccess).mockResolvedValue({
    allowed: true,
    role: "owner",
  });
}

function mockViewerAccess(): void {
  vi.mocked(resolveMemberAccess).mockResolvedValue({
    allowed: false,
    reason: "forbidden",
  });
}

describe("Day 26–27 — AI analyze property images integration", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = "test";
    process.env.ENABLE_AI_VISION = "false";
    mockOwnerAccess();
    vi.mocked(checkAiVisionRateLimit).mockReset();
    vi.mocked(consumeAiVisionRateLimit).mockReset();
    vi.mocked(analyzePropertyImages).mockReset();
    vi.mocked(checkAiVisionRateLimit).mockResolvedValue({ allowed: true });
    vi.mocked(consumeAiVisionRateLimit).mockResolvedValue(undefined);
    vi.mocked(analyzePropertyImages).mockResolvedValue(llmAnalysis);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 401 for unauthenticated POST /v1/ai/analyze-property-images", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: { "content-type": "application/json" },
      payload: mockPayload,
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it("returns 403 for viewer role on analyze endpoint", async () => {
    mockViewerAccess();

    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: {
        authorization: createMockSessionAuthorization(tenantId),
        "content-type": "application/json",
      },
      payload: mockPayload,
    });

    expect(response.statusCode).toBe(403);

    await app.close();
  });

  it("returns mock analysis when ENABLE_AI_VISION is false", async () => {
    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: {
        authorization: createMockSessionAuthorization(tenantId),
        "content-type": "application/json",
      },
      payload: mockPayload,
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
    expect(checkAiVisionRateLimit).not.toHaveBeenCalled();
    expect(analyzePropertyImages).not.toHaveBeenCalled();

    await app.close();
  });

  it("returns LLM analysis when ENABLE_AI_VISION is true", async () => {
    process.env.ENABLE_AI_VISION = "true";
    setStorageEnv();

    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: {
        authorization: createMockSessionAuthorization(tenantId),
        "content-type": "application/json",
      },
      payload: { imageUrls: [validPresignedUrl] },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as PropertyImageAnalysis;

    expect(propertyImageAnalysisSchema.parse(body)).toEqual(llmAnalysis);
    expect(checkAiVisionRateLimit).toHaveBeenCalledWith(tenantId);
    expect(consumeAiVisionRateLimit).toHaveBeenCalledWith(tenantId);
    expect(analyzePropertyImages).toHaveBeenCalledWith([validPresignedUrl]);

    await app.close();
  });

  it("returns 400 for external image URLs when ENABLE_AI_VISION is true", async () => {
    process.env.ENABLE_AI_VISION = "true";
    setStorageEnv();

    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: {
        authorization: createMockSessionAuthorization(tenantId),
        "content-type": "application/json",
      },
      payload: mockPayload,
    });

    expect(response.statusCode).toBe(400);
    expect(analyzePropertyImages).not.toHaveBeenCalled();
    expect(consumeAiVisionRateLimit).not.toHaveBeenCalled();

    await app.close();
  });

  it("returns 429 with Retry-After when rate limit is exceeded", async () => {
    process.env.ENABLE_AI_VISION = "true";
    setStorageEnv();
    vi.mocked(checkAiVisionRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 900,
    });

    const app = await buildApp({ mountAuthRoutes: false });

    const response = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: {
        authorization: createMockSessionAuthorization(tenantId),
        "content-type": "application/json",
      },
      payload: { imageUrls: [validPresignedUrl] },
    });

    expect(response.statusCode).toBe(429);
    expect(response.headers["retry-after"]).toBe("900");
    expect(analyzePropertyImages).not.toHaveBeenCalled();
    expect(consumeAiVisionRateLimit).not.toHaveBeenCalled();

    await app.close();
  });

  it("returns 429 on the 11th blocked rate-limit check", async () => {
    process.env.ENABLE_AI_VISION = "true";
    setStorageEnv();

    let callCount = 0;
    vi.mocked(checkAiVisionRateLimit).mockImplementation(async () => {
      callCount += 1;

      if (callCount > 10) {
        return { allowed: false, retryAfterSeconds: 1200 };
      }

      return { allowed: true };
    });

    const app = await buildApp({ mountAuthRoutes: false });

    for (let index = 0; index < 10; index += 1) {
      const allowedResponse = await app.inject({
        method: "POST",
        url: "/v1/ai/analyze-property-images",
        headers: {
          authorization: createMockSessionAuthorization(tenantId),
          "content-type": "application/json",
        },
        payload: { imageUrls: [validPresignedUrl] },
      });

      expect(allowedResponse.statusCode).toBe(200);
    }

    const blockedResponse = await app.inject({
      method: "POST",
      url: "/v1/ai/analyze-property-images",
      headers: {
        authorization: createMockSessionAuthorization(tenantId),
        "content-type": "application/json",
      },
      payload: { imageUrls: [validPresignedUrl] },
    });

    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.headers["retry-after"]).toBe("1200");
    expect(checkAiVisionRateLimit).toHaveBeenCalledTimes(11);

    await app.close();
  });
});
