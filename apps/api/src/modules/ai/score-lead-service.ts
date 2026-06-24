import {
  derivePriority,
  scoreLeadResponseSchema,
  type LeadScoringLeadData,
  type ScoreLeadResponse,
} from "@propai/shared";
import { generateObject } from "ai";
import { ZodError } from "zod";

import { getOpenAiProvider } from "../../lib/embedding-provider.js";
import { AiAnalysisParseError, AiProviderNotConfiguredError } from "./ai-errors.js";
import {
  buildLeadScoringUserPrompt,
  LEAD_SCORING_SYSTEM_PROMPT,
} from "./prompts/lead-scoring-prompt.js";

export type LeadScoringProperty = {
  title: string;
  priceUsdCents: number;
  city: string;
  state: string;
  bedrooms: number;
  sqFt: number;
};

function getScoringModelId(): string {
  const configured = process.env.OPENAI_SCORING_MODEL?.trim();
  return configured ?? "gpt-4o-mini";
}

export async function scoreLeadWithAI(
  leadData: LeadScoringLeadData,
  property: LeadScoringProperty,
): Promise<ScoreLeadResponse> {
  const provider = getOpenAiProvider();

  if (!provider) {
    throw new AiProviderNotConfiguredError("OpenAI API is not configured.");
  }

  const modelId = getScoringModelId();
  const userPrompt = buildLeadScoringUserPrompt(leadData, property);

  const outputSchema = scoreLeadResponseSchema.omit({ priority: true });

  try {
    const { object } = await generateObject({
      model: provider(modelId),
      schema: outputSchema,
      system: LEAD_SCORING_SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    const score = object.score;
    const priority = derivePriority(score);

    return scoreLeadResponseSchema.parse({
      score,
      priority,
      reasoning: object.reasoning,
    });
  } catch (error) {
    if (error instanceof AiProviderNotConfiguredError) {
      throw error;
    }

    if (error instanceof ZodError) {
      throw new AiAnalysisParseError("Lead scoring response could not be validated.");
    }

    if (error instanceof AiAnalysisParseError) {
      throw error;
    }

    throw new AiAnalysisParseError("Lead scoring failed unexpectedly.");
  }
}
