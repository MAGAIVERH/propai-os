import {
  analyzeImagesJobStatusResponseSchema,
  type AnalyzeImagesJobStatusResponse,
} from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";

export async function getAnalyzeJobStatus(
  jobId: string,
): Promise<AnalyzeImagesJobStatusResponse> {
  const response = await apiFetch(
    `/v1/ai/jobs/${encodeURIComponent(jobId)}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = analyzeImagesJobStatusResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Invalid analyze job status response.",
      500,
      "Internal Server Error",
    );
  }

  return parsed.data;
}
