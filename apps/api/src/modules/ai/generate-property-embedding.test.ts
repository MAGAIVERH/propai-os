import { embed } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOpenAiEmbeddingModelId,
  getOpenAiProvider,
  PROPERTY_EMBEDDING_DIMENSIONS,
  type OpenAiProvider,
} from "../../lib/embedding-provider.js";
import { AiProviderNotConfiguredError } from "./ai-errors.js";
import {
  generatePropertyEmbedding,
  InvalidEmbeddingDimensionError,
} from "./generate-property-embedding.js";

const mockEmbeddingModel = { modelId: "text-embedding-3-small" };

const mockProvider = {
  embedding: vi.fn(() => mockEmbeddingModel),
} as unknown as OpenAiProvider;

function buildEmbedding(length: number): number[] {
  return Array.from({ length }, (_, index) => index / length);
}

vi.mock("ai", () => ({
  embed: vi.fn(),
}));

vi.mock("../../lib/embedding-provider.js", () => ({
  getOpenAiProvider: vi.fn(),
  getOpenAiEmbeddingModelId: vi.fn(),
  PROPERTY_EMBEDDING_DIMENSIONS: 1536,
}));

describe("generatePropertyEmbedding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOpenAiProvider).mockReturnValue(mockProvider);
    vi.mocked(getOpenAiEmbeddingModelId).mockReturnValue(
      "text-embedding-3-small",
    );
    vi.mocked(embed).mockResolvedValue({
      embedding: buildEmbedding(PROPERTY_EMBEDDING_DIMENSIONS),
    } as Awaited<ReturnType<typeof embed>>);
  });

  it("throws AiProviderNotConfiguredError when OpenAI is not configured", async () => {
    vi.mocked(getOpenAiProvider).mockReturnValue(null);

    await expect(generatePropertyEmbedding("hello")).rejects.toBeInstanceOf(
      AiProviderNotConfiguredError,
    );
  });

  it("calls embed with OpenAI model and 1536 dimensions", async () => {
    const text = "Spacious home\npool: true";

    const result = await generatePropertyEmbedding(text);

    expect(mockProvider.embedding).toHaveBeenCalledWith("text-embedding-3-small");
    expect(embed).toHaveBeenCalledWith({
      model: mockEmbeddingModel,
      value: text,
      providerOptions: {
        openai: {
          dimensions: PROPERTY_EMBEDDING_DIMENSIONS,
        },
      },
    });
    expect(result).toHaveLength(PROPERTY_EMBEDDING_DIMENSIONS);
  });

  it("throws InvalidEmbeddingDimensionError when vector length is wrong", async () => {
    vi.mocked(embed).mockResolvedValue({
      embedding: buildEmbedding(512),
    } as Awaited<ReturnType<typeof embed>>);

    await expect(generatePropertyEmbedding("hello")).rejects.toBeInstanceOf(
      InvalidEmbeddingDimensionError,
    );
  });
});
