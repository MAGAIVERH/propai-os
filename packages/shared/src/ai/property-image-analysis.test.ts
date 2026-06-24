import { describe, expect, it } from "vitest";

import {
  analyzePropertyImagesRequestSchema,
  analyzePropertyImagesResponseSchema,
  MOCK_PROPERTY_IMAGE_ANALYSIS,
  propertyImageAnalysisSchema,
} from "./property-image-analysis.js";

describe("propertyImageAnalysisSchema", () => {
  it("parses MOCK_PROPERTY_IMAGE_ANALYSIS", () => {
    const result = propertyImageAnalysisSchema.parse(MOCK_PROPERTY_IMAGE_ANALYSIS);

    expect(result.bedrooms).toBe(3);
    expect(result.bathrooms).toBe(2.5);
    expect(result.sqFt).toBe(1850);
    expect(result.features).toEqual(["pool", "garage", "updated kitchen"]);
    expect(result.suggestedPriceUSD).toBe(485_000);
  });

  it("accepts null suggestedPriceUSD", () => {
    const result = propertyImageAnalysisSchema.parse({
      ...MOCK_PROPERTY_IMAGE_ANALYSIS,
      suggestedPriceUSD: null,
    });

    expect(result.suggestedPriceUSD).toBeNull();
  });

  it("rejects zero sqFt", () => {
    const result = propertyImageAnalysisSchema.safeParse({
      ...MOCK_PROPERTY_IMAGE_ANALYSIS,
      sqFt: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe("analyzePropertyImagesRequestSchema", () => {
  it("accepts one to ten image URLs", () => {
    const result = analyzePropertyImagesRequestSchema.safeParse({
      imageUrls: ["https://example.com/photo.jpg"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty imageUrls array", () => {
    const result = analyzePropertyImagesRequestSchema.safeParse({
      imageUrls: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects more than ten image URLs", () => {
    const imageUrls = Array.from(
      { length: 11 },
      (_, index) => `https://example.com/photo-${index}.jpg`,
    );

    const result = analyzePropertyImagesRequestSchema.safeParse({ imageUrls });

    expect(result.success).toBe(false);
  });
});

describe("analyzePropertyImagesResponseSchema", () => {
  it("validates the mock fixture as a response", () => {
    const result = analyzePropertyImagesResponseSchema.parse(MOCK_PROPERTY_IMAGE_ANALYSIS);

    expect(result.seoTitle).toBe(MOCK_PROPERTY_IMAGE_ANALYSIS.seoTitle);
  });
});
