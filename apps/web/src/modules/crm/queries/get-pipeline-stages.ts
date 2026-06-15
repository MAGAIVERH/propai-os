import { pipelineStageListResponseSchema, type PipelineStageListResponse } from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function getPipelineStages(): Promise<PipelineStageListResponse> {
  const response = await apiFetch("/v1/pipeline-stages");

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = pipelineStageListResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError("Invalid pipeline stages response.", 500, "Internal Server Error");
  }

  return parsed.data;
}
