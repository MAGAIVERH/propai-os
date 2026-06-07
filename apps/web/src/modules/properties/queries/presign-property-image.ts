import {
  presignUploadResponseSchema,
  type PresignUploadRequest,
  type PresignUploadResponse,
} from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";

export async function presignPropertyImage(
  input: PresignUploadRequest,
): Promise<PresignUploadResponse> {
  const response = await apiFetch("/v1/uploads/presign", {
    method: "POST",
    json: input,
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = presignUploadResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Invalid presign upload response.",
      500,
      "Internal Server Error",
    );
  }

  return parsed.data;
}
