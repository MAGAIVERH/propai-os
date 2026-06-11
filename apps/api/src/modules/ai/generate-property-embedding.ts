import { embed } from "ai";

import {
  getOpenAiEmbeddingModelId,
  getOpenAiProvider,
  PROPERTY_EMBEDDING_DIMENSIONS,
} from "../../lib/embedding-provider.js";
import { AiProviderNotConfiguredError } from "./ai-errors.js";

export class InvalidEmbeddingDimensionError extends Error {
  constructor(
    message = `Embedding must have exactly ${PROPERTY_EMBEDDING_DIMENSIONS} dimensions.`,
  ) {
    super(message);
    this.name = "InvalidEmbeddingDimensionError";
  }
}

export async function generatePropertyEmbedding(
  text: string,
): Promise<number[]> {
  const provider = getOpenAiProvider();

  if (!provider) {
    throw new AiProviderNotConfiguredError("OpenAI API is not configured.");
  }

  const modelId = getOpenAiEmbeddingModelId();

  const { embedding } = await embed({
    model: provider.embedding(modelId),
    value: text,
    providerOptions: {
      openai: {
        dimensions: PROPERTY_EMBEDDING_DIMENSIONS,
      },
    },
  });

  if (embedding.length !== PROPERTY_EMBEDDING_DIMENSIONS) {
    throw new InvalidEmbeddingDimensionError();
  }

  return embedding;
}
