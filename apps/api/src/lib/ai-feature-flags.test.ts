import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isAiVisionEnabled } from "./ai-feature-flags.js";

const originalEnv = { ...process.env };

describe("isAiVisionEnabled", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns true when ENABLE_AI_VISION is "true"', () => {
    process.env.ENABLE_AI_VISION = "true";

    expect(isAiVisionEnabled()).toBe(true);
  });

  it('returns true when ENABLE_AI_VISION is "TRUE" (case-insensitive)', () => {
    process.env.ENABLE_AI_VISION = "TRUE";

    expect(isAiVisionEnabled()).toBe(true);
  });

  it('returns false when ENABLE_AI_VISION is "false"', () => {
    process.env.ENABLE_AI_VISION = "false";

    expect(isAiVisionEnabled()).toBe(false);
  });

  it("returns false when ENABLE_AI_VISION is unset", () => {
    delete process.env.ENABLE_AI_VISION;

    expect(isAiVisionEnabled()).toBe(false);
  });

  it("returns false when ENABLE_AI_VISION is an empty string", () => {
    process.env.ENABLE_AI_VISION = "";

    expect(isAiVisionEnabled()).toBe(false);
  });
});
