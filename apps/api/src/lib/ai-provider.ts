import { createOpenAI } from "@ai-sdk/openai";

export type OpenAiProvider = ReturnType<typeof createOpenAI>;

function readOpenAiApiKey(): string | null {
  const value = process.env.OPENAI_API_KEY?.trim();

  if (!value) {
    return null;
  }

  return value;
}

/** Returns null when OPENAI_API_KEY is missing or empty (no throw). */
export function getOpenAiProvider(): OpenAiProvider | null {
  const apiKey = readOpenAiApiKey();

  if (!apiKey) {
    return null;
  }

  return createOpenAI({ apiKey });
}
