import type { PropertyImageAnalysis } from "@propai/shared";

import type { CreatePropertyFormValues } from "@/modules/properties/schemas/create-property";

function formatBathroomsForForm(bathrooms: number): string {
  const rounded = Math.round(bathrooms * 2) / 2;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function buildDescriptionWithFeatures(analysis: PropertyImageAnalysis): string {
  const trimmedDescription = analysis.description.trim();

  if (analysis.features.length === 0) {
    return trimmedDescription;
  }

  const featureLines = analysis.features.map((feature) => `• ${feature.trim()}`);
  const featureBlock = ["Features:", ...featureLines].join("\n");

  return trimmedDescription.length > 0
    ? `${trimmedDescription}\n\n${featureBlock}`
    : featureBlock;
}

function shouldApplyTitle(
  seoTitle: string,
  current?: Partial<CreatePropertyFormValues>,
): boolean {
  const trimmedTitle = seoTitle.trim();

  if (trimmedTitle.length === 0) {
    return false;
  }

  const currentTitle = current?.title?.trim() ?? "";
  return currentTitle.length === 0;
}

export function mapAiAnalysisToFormValues(
  analysis: PropertyImageAnalysis,
  current?: Partial<CreatePropertyFormValues>,
): Partial<CreatePropertyFormValues> {
  const mapped: Partial<CreatePropertyFormValues> = {
    description: buildDescriptionWithFeatures(analysis),
    bedrooms: analysis.bedrooms,
    bathrooms: formatBathroomsForForm(analysis.bathrooms),
    sqFt: analysis.sqFt,
  };

  if (shouldApplyTitle(analysis.seoTitle, current)) {
    mapped.title = analysis.seoTitle.trim();
  }

  if (analysis.suggestedPriceUSD !== null && analysis.suggestedPriceUSD > 0) {
    mapped.priceUsd = analysis.suggestedPriceUSD;
  }

  return mapped;
}
