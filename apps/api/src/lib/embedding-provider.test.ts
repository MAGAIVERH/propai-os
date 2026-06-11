import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getOpenAiEmbeddingModelId,
  getOpenAiProvider,
  DEFAULT_OPENAI_EMBEDDING_MODEL,
} from "./embedding-provider.js";

const originalEnv = { ...process.env };

describe("getOpenAiProvider", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when OPENAI_API_KEY is unset", () => {
    expect(getOpenAiProvider()).toBeNull();
  });

  it("returns null when OPENAI_API_KEY is empty", () => {
    process.env.OPENAI_API_KEY = "   ";

    expect(getOpenAiProvider()).toBeNull();
  });

  it("returns a provider when OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "test-openai-key";

    expect(getOpenAiProvider()).not.toBeNull();
  });
});

describe("getOpenAiEmbeddingModelId", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENAI_EMBEDDING_MODEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns the default model when OPENAI_EMBEDDING_MODEL is unset", () => {
    expect(getOpenAiEmbeddingModelId()).toBe(DEFAULT_OPENAI_EMBEDDING_MODEL);
  });

  it("returns OPENAI_EMBEDDING_MODEL when configured", () => {
    process.env.OPENAI_EMBEDDING_MODEL = "text-embedding-3-large";

    expect(getOpenAiEmbeddingModelId()).toBe("text-embedding-3-large");
  });
});
