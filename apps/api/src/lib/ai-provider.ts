import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type GeminiProvider = ReturnType<typeof createGoogleGenerativeAI>;

/** Default vision-capable model (Gemini free tier friendly). Override with GEMINI_MODEL. */
export const DEFAULT_GEMINI_VISION_MODEL = "gemini-2.0-flash";

const GEMINI_API_KEY_ENV_NAMES = [
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
] as const;

function readGeminiApiKey(): string | null {
  for (const envName of GEMINI_API_KEY_ENV_NAMES) {
    const value = process.env[envName]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

/** Returns null when no Gemini API key env var is set (no throw). */
export function getGeminiProvider(): GeminiProvider | null {
  const apiKey = readGeminiApiKey();

  if (!apiKey) {
    return null;
  }

  return createGoogleGenerativeAI({ apiKey });
}

/** Model id for vision/analysis calls. Defaults to {@link DEFAULT_GEMINI_VISION_MODEL}. */
export function getGeminiVisionModelId(): string {
  const configured = process.env.GEMINI_MODEL?.trim();

  if (configured) {
    return configured;
  }

  return DEFAULT_GEMINI_VISION_MODEL;
}
