import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_GEMINI_VISION_MODEL,
  getGeminiProvider,
  getGeminiVisionModelId,
} from "./ai-provider.js";

const originalEnv = { ...process.env };

function clearGeminiEnv(): void {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  delete process.env.GEMINI_MODEL;
}

describe("getGeminiProvider", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    clearGeminiEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when no Gemini API key env var is set", () => {
    expect(getGeminiProvider()).toBeNull();
  });

  it("returns null when GEMINI_API_KEY is empty", () => {
    process.env.GEMINI_API_KEY = "   ";

    expect(getGeminiProvider()).toBeNull();
  });

  it("returns a provider when GEMINI_API_KEY is set", () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    expect(getGeminiProvider()).not.toBeNull();
  });

  it("falls back to GOOGLE_GENERATIVE_AI_API_KEY", () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-key";

    expect(getGeminiProvider()).not.toBeNull();
  });

  it("prefers GEMINI_API_KEY over GOOGLE_GENERATIVE_AI_API_KEY", () => {
    process.env.GEMINI_API_KEY = "primary-key";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "secondary-key";

    const provider = getGeminiProvider();

    expect(provider).not.toBeNull();
  });
});

describe("getGeminiVisionModelId", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns the default model when GEMINI_MODEL is unset", () => {
    expect(getGeminiVisionModelId()).toBe(DEFAULT_GEMINI_VISION_MODEL);
  });

  it("returns GEMINI_MODEL when configured", () => {
    process.env.GEMINI_MODEL = "gemini-2.5-flash";

    expect(getGeminiVisionModelId()).toBe("gemini-2.5-flash");
  });
});
