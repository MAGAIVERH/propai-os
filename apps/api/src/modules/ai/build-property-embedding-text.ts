export type PropertyEmbeddingFeature = {
  featureKey: string;
  featureValue: string;
};

export type BuildPropertyEmbeddingTextInput = {
  title: string;
  description: string | null;
  features: PropertyEmbeddingFeature[];
};

/** Concatenates title, description, and feature lines for embedding input. */
export function buildPropertyEmbeddingText({
  title,
  description,
  features,
}: BuildPropertyEmbeddingTextInput): string {
  const lines: string[] = [title];

  if (description) {
    lines.push(description);
  }

  for (const { featureKey, featureValue } of features) {
    lines.push(`${featureKey}: ${featureValue}`);
  }

  return lines.join("\n");
}
