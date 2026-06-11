import { MOCK_PROPERTY_IMAGE_ANALYSIS } from "@propai/shared";
import { describe, expect, it } from "vitest";

import { mapAiAnalysisToFormValues } from "@/modules/properties/lib/map-ai-analysis-to-form";

describe("mapAiAnalysisToFormValues", () => {
  it("maps core fields from AI analysis", () => {
    const result = mapAiAnalysisToFormValues(MOCK_PROPERTY_IMAGE_ANALYSIS);

    expect(result).toEqual({
      title: MOCK_PROPERTY_IMAGE_ANALYSIS.seoTitle,
      description: [
        MOCK_PROPERTY_IMAGE_ANALYSIS.description,
        "",
        "Features:",
        "• pool",
        "• garage",
        "• updated kitchen",
      ].join("\n"),
      bedrooms: 3,
      bathrooms: "2.5",
      sqFt: 1850,
      priceUsd: 485_000,
    });
  });

  it("formats whole-number bathrooms as strings", () => {
    const result = mapAiAnalysisToFormValues({
      ...MOCK_PROPERTY_IMAGE_ANALYSIS,
      bathrooms: 2,
    });

    expect(result.bathrooms).toBe("2");
  });

  it("rounds bathrooms to the nearest half bath", () => {
    const result = mapAiAnalysisToFormValues({
      ...MOCK_PROPERTY_IMAGE_ANALYSIS,
      bathrooms: 2.3,
    });

    expect(result.bathrooms).toBe("2.5");
  });

  it("omits priceUsd when suggestedPriceUSD is null", () => {
    const result = mapAiAnalysisToFormValues({
      ...MOCK_PROPERTY_IMAGE_ANALYSIS,
      suggestedPriceUSD: null,
    });

    expect(result.priceUsd).toBeUndefined();
  });

  it("keeps an existing title when current values include one", () => {
    const result = mapAiAnalysisToFormValues(MOCK_PROPERTY_IMAGE_ANALYSIS, {
      title: "Existing listing title",
    });

    expect(result.title).toBeUndefined();
    expect(result.bedrooms).toBe(3);
  });

  it("applies seoTitle when the current title is empty", () => {
    const result = mapAiAnalysisToFormValues(MOCK_PROPERTY_IMAGE_ANALYSIS, {
      title: "   ",
    });

    expect(result.title).toBe(MOCK_PROPERTY_IMAGE_ANALYSIS.seoTitle);
  });

  it("never maps address fields", () => {
    const result = mapAiAnalysisToFormValues(MOCK_PROPERTY_IMAGE_ANALYSIS);

    expect(result).not.toHaveProperty("addressLine1");
    expect(result).not.toHaveProperty("addressLine2");
    expect(result).not.toHaveProperty("city");
    expect(result).not.toHaveProperty("state");
    expect(result).not.toHaveProperty("zipCode");
    expect(result).not.toHaveProperty("latitude");
    expect(result).not.toHaveProperty("longitude");
  });

  it("builds description from features only when description is empty", () => {
    const result = mapAiAnalysisToFormValues({
      ...MOCK_PROPERTY_IMAGE_ANALYSIS,
      description: "",
      features: ["pool", "garage"],
    });

    expect(result.description).toBe("Features:\n• pool\n• garage");
  });
});
