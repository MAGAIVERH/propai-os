import {
  propertyImageAnalysisSchema,
  type PropertyImageAnalysis,
} from "@propai/shared";
import { generateObject } from "ai";
import { ZodError } from "zod";

import {
  getGeminiProvider,
  getGeminiVisionModelId,
} from "../../lib/ai-provider.js";
import {
  AiAnalysisParseError,
  AiProviderNotConfiguredError,
} from "./ai-errors.js";
import {
  buildPropertyVisionUserPrompt,
  PROPERTY_VISION_SYSTEM_PROMPT,
} from "./prompts/property-vision-prompt.js";

function buildVisionMessages(imageUrls: string[]) {
  return [
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: buildPropertyVisionUserPrompt(imageUrls.length),
        },
        ...imageUrls.map((url) => ({
          type: "image" as const,
          image: url,
        })),
      ],
    },
  ];
}

export async function analyzePropertyImages(
  imageUrls: string[],
): Promise<PropertyImageAnalysis> {
  const provider = getGeminiProvider();

  if (!provider) {
    throw new AiProviderNotConfiguredError();
  }

  const modelId = getGeminiVisionModelId();

  try {
    const { object } = await generateObject({
      model: provider(modelId),
      schema: propertyImageAnalysisSchema,
      system: PROPERTY_VISION_SYSTEM_PROMPT,
      messages: buildVisionMessages(imageUrls),
    });

    return propertyImageAnalysisSchema.parse(object);
  } catch (error) {
    if (error instanceof AiProviderNotConfiguredError) {
      throw error;
    }

    if (error instanceof ZodError) {
      throw new AiAnalysisParseError();
    }

    if (error instanceof AiAnalysisParseError) {
      throw error;
    }

    throw new AiAnalysisParseError();
  }
}
