import {
  presignDownloadResponseSchema,
  type PresignDownloadResponse,
} from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";

export async function presignPropertyImageDownload(
  storageKey: string,
): Promise<PresignDownloadResponse> {
  const params = new URLSearchParams({ key: storageKey });
  const response = await apiFetch(
    `/v1/uploads/presign-download?${params.toString()}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = presignDownloadResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Resposta inválida ao gerar URL de download da foto.",
      500,
      "Internal Server Error",
    );
  }

  return parsed.data;
}
