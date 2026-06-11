import { describe, expect, it } from "vitest";

import {
  buildPropertyVisionUserPrompt,
  PROPERTY_VISION_SYSTEM_PROMPT,
} from "./property-vision-prompt.js";

describe("PROPERTY_VISION_SYSTEM_PROMPT", () => {
  it("is a non-empty string with schema field instructions", () => {
    expect(PROPERTY_VISION_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    expect(PROPERTY_VISION_SYSTEM_PROMPT).toContain("bedrooms");
    expect(PROPERTY_VISION_SYSTEM_PROMPT).toContain("bathrooms");
    expect(PROPERTY_VISION_SYSTEM_PROMPT).toContain("sqFt");
    expect(PROPERTY_VISION_SYSTEM_PROMPT).toContain("features");
    expect(PROPERTY_VISION_SYSTEM_PROMPT).toContain("description");
    expect(PROPERTY_VISION_SYSTEM_PROMPT).toContain("seoTitle");
    expect(PROPERTY_VISION_SYSTEM_PROMPT).toContain("suggestedPriceUSD");
    expect(PROPERTY_VISION_SYSTEM_PROMPT).toContain("null");
  });
});

describe("buildPropertyVisionUserPrompt", () => {
  it("returns a non-empty user prompt", () => {
    const prompt = buildPropertyVisionUserPrompt(3);

    expect(prompt.length).toBeGreaterThan(20);
  });

  it("reflects the image count in singular form", () => {
    const prompt = buildPropertyVisionUserPrompt(1);
    const firstLine = prompt.split("\n")[0] ?? "";

    expect(firstLine).toContain("1 attached US property photo");
    expect(firstLine).not.toContain("photos");
  });

  it("reflects the image count in plural form", () => {
    const prompt = buildPropertyVisionUserPrompt(5);

    expect(prompt).toContain("5 attached US property photos");
  });

  it("mentions US listing context and JSON schema fields", () => {
    const prompt = buildPropertyVisionUserPrompt(2);

    expect(prompt).toContain("US");
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("bedrooms");
    expect(prompt).toContain("suggestedPriceUSD");
  });
});
