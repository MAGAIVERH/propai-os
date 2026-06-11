/** True only when ENABLE_AI_VISION is exactly "true" (case-insensitive). */
export function isAiVisionEnabled(): boolean {
  const value = process.env.ENABLE_AI_VISION?.trim();

  if (!value) {
    return false;
  }

  return value.toLowerCase() === "true";
}
