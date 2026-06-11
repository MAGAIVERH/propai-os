import {
  analyzePropertyImagesRequestSchema,
  analyzePropertyImagesResponseSchema,
  enqueueAnalyzeImagesJobResponseSchema,
  type PropertyImageAnalysis,
} from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";

export type AnalyzePropertyImagesImmediateResult = {
  kind: "immediate";
  analysis: PropertyImageAnalysis;
};

export type AnalyzePropertyImagesQueuedResult = {
  kind: "queued";
  jobId: string;
};

export type AnalyzePropertyImagesResult =
  | AnalyzePropertyImagesImmediateResult
  | AnalyzePropertyImagesQueuedResult;

export async function analyzePropertyImages(
  imageUrls: string[],
): Promise<AnalyzePropertyImagesResult> {
  const body = analyzePropertyImagesRequestSchema.parse({ imageUrls });

  const response = await apiFetch("/v1/ai/analyze-property-images", {
    method: "POST",
    json: body,
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const responseBody: unknown = await response.json();

  if (response.status === 202) {
    const parsed = enqueueAnalyzeImagesJobResponseSchema.safeParse(responseBody);

    if (!parsed.success) {
      throw new ApiClientError(
        "Invalid analyze images enqueue response.",
        500,
        "Internal Server Error",
      );
    }

    return { kind: "queued", jobId: parsed.data.jobId };
  }

  const parsed = analyzePropertyImagesResponseSchema.safeParse(responseBody);

  if (!parsed.success) {
    throw new ApiClientError(
      "Invalid analyze property images response.",
      500,
      "Internal Server Error",
    );
  }

  return { kind: "immediate", analysis: parsed.data };
}
