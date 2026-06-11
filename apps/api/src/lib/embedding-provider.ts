import { createOpenAI } from "@ai-sdk/openai";

export type OpenAiProvider = ReturnType<typeof createOpenAI>;

/** OpenAI embedding model — 1536 dimensions by default. */
export const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

/** Expected vector length for property semantic search (REQUIREMENTS). */
export const PROPERTY_EMBEDDING_DIMENSIONS = 1536;

function readOpenAiApiKey(): string | null {
  const value = process.env.OPENAI_API_KEY?.trim();

  if (!value) {
    return null;
  }

  return value;
}

/** Returns null when OPENAI_API_KEY is unset (no throw). */
export function getOpenAiProvider(): OpenAiProvider | null {
  const apiKey = readOpenAiApiKey();

  if (!apiKey) {
    return null;
  }

  return createOpenAI({ apiKey });
}

/** Model id for embedding calls. Defaults to {@link DEFAULT_OPENAI_EMBEDDING_MODEL}. */
export function getOpenAiEmbeddingModelId(): string {
  const configured = process.env.OPENAI_EMBEDDING_MODEL?.trim();

  if (configured) {
    return configured;
  }

  return DEFAULT_OPENAI_EMBEDDING_MODEL;
}
