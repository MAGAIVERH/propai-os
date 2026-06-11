import { describe, expect, it } from "vitest";

import { buildPropertyEmbeddingText } from "./build-property-embedding-text.js";

describe("buildPropertyEmbeddingText", () => {
  it("concatenates title, description, and feature lines with newlines", () => {
    const text = buildPropertyEmbeddingText({
      title: "Spacious 4BR Colonial",
      description: "Updated kitchen with granite counters.",
      features: [
        { featureKey: "pool", featureValue: "true" },
        { featureKey: "garage", featureValue: "2-car" },
      ],
    });

    expect(text).toBe(
      [
        "Spacious 4BR Colonial",
        "Updated kitchen with granite counters.",
        "pool: true",
        "garage: 2-car",
      ].join("\n"),
    );
  });

  it("omits description when null", () => {
    const text = buildPropertyEmbeddingText({
      title: "Downtown Condo",
      description: null,
      features: [{ featureKey: "balcony", featureValue: "true" }],
    });

    expect(text).toBe(["Downtown Condo", "balcony: true"].join("\n"));
  });

  it("returns only title when description is null and features are empty", () => {
    const text = buildPropertyEmbeddingText({
      title: "Starter Home",
      description: null,
      features: [],
    });

    expect(text).toBe("Starter Home");
  });
});
