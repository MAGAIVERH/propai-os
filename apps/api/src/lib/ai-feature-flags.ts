function isEnvFlagTrue(envName: string): boolean {
  const value = process.env[envName]?.trim();

  if (!value) {
    return false;
  }

  return value.toLowerCase() === "true";
}

/** True only when ENABLE_AI_VISION is exactly "true" (case-insensitive). */
export function isAiVisionEnabled(): boolean {
  return isEnvFlagTrue("ENABLE_AI_VISION");
}

/** True only when ENABLE_SEMANTIC_SEARCH is exactly "true" (case-insensitive). */
export function isSemanticSearchEnabled(): boolean {
  return isEnvFlagTrue("ENABLE_SEMANTIC_SEARCH");
}

/** True only when ENABLE_AI_SCORING is exactly "true" (case-insensitive). */
export function isAiScoringEnabled(): boolean {
  return isEnvFlagTrue("ENABLE_AI_SCORING");
}

/** True only when ENABLE_AI_PRICING is exactly "true" (case-insensitive). */
export function isAiPricingEnabled(): boolean {
  return isEnvFlagTrue("ENABLE_AI_PRICING");
}
