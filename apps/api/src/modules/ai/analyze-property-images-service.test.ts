import { propertyImageAnalysisSchema } from "@propai/shared";
import { generateObject } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getGeminiProvider,
  getGeminiVisionModelId,
  type GeminiProvider,
} from "../../lib/ai-provider.js";
import { analyzePropertyImages } from "./analyze-property-images-service.js";
import {
  AiAnalysisParseError,
  AiProviderNotConfiguredError,
} from "./ai-errors.js";
import {
  buildPropertyVisionUserPrompt,
  PROPERTY_VISION_SYSTEM_PROMPT,
} from "./prompts/property-vision-prompt.js";

const mockAnalysis = {
  bedrooms: 4,
  bathrooms: 3,
  sqFt: 2200,
  features: ["fireplace", "deck"],
  description: "Bright colonial with updated kitchen and fenced yard.",
  seoTitle: "4BR Colonial with Deck — Updated Kitchen",
  suggestedPriceUSD: 525_000,
};

const mockProvider = vi.fn((modelId: string) => ({ modelId })) as unknown as GeminiProvider;

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("../../lib/ai-provider.js", () => ({
  getGeminiProvider: vi.fn(),
  getGeminiVisionModelId: vi.fn(),
}));

describe("analyzePropertyImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGeminiProvider).mockReturnValue(mockProvider);
    vi.mocked(getGeminiVisionModelId).mockReturnValue("gemini-2.0-flash");
    vi.mocked(generateObject).mockResolvedValue({
      object: mockAnalysis,
    } as Awaited<ReturnType<typeof generateObject>>);
  });

  it("throws AiProviderNotConfiguredError when Gemini is not configured", async () => {
    vi.mocked(getGeminiProvider).mockReturnValue(null);

    await expect(
      analyzePropertyImages(["https://storage.example/photo.jpg"]),
    ).rejects.toBeInstanceOf(AiProviderNotConfiguredError);
  });

  it("calls generateObject with Gemini model, prompts, and image URLs", async () => {
    const imageUrls = [
      "https://storage.example/photo-1.jpg",
      "https://storage.example/photo-2.jpg",
    ];

    const result = await analyzePropertyImages(imageUrls);

    expect(mockProvider).toHaveBeenCalledWith("gemini-2.0-flash");
    expect(generateObject).toHaveBeenCalledWith({
      model: { modelId: "gemini-2.0-flash" },
      schema: propertyImageAnalysisSchema,
      system: PROPERTY_VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildPropertyVisionUserPrompt(2),
            },
            { type: "image", image: imageUrls[0] },
            { type: "image", image: imageUrls[1] },
          ],
        },
      ],
    });
    expect(result).toEqual(mockAnalysis);
  });

  it("throws AiAnalysisParseError when the LLM object fails Zod validation", async () => {
    vi.mocked(generateObject).mockResolvedValue({
      object: { bedrooms: -1 },
    } as Awaited<ReturnType<typeof generateObject>>);

    await expect(
      analyzePropertyImages(["https://storage.example/photo.jpg"]),
    ).rejects.toBeInstanceOf(AiAnalysisParseError);
  });

  it("throws AiAnalysisParseError when generateObject fails", async () => {
    vi.mocked(generateObject).mockRejectedValue(new Error("upstream failure"));

    await expect(
      analyzePropertyImages(["https://storage.example/photo.jpg"]),
    ).rejects.toBeInstanceOf(AiAnalysisParseError);
  });
});
