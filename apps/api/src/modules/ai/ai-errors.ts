export class AiProviderNotConfiguredError extends Error {
  constructor(message = "Gemini API is not configured.") {
    super(message);
    this.name = "AiProviderNotConfiguredError";
  }
}

export class AiAnalysisParseError extends Error {
  constructor(message = "AI vision response could not be validated.") {
    super(message);
    this.name = "AiAnalysisParseError";
  }
}
