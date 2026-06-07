import {
  imageConfirmResponseSchema,
  type ImageConfirmRequest,
  type PropertyImageResponse,
} from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";

export async function confirmPropertyImage(
  propertyId: string,
  input: ImageConfirmRequest,
): Promise<PropertyImageResponse> {
  const response = await apiFetch(
    `/v1/properties/${propertyId}/images/confirm`,
    {
      method: "POST",
      json: input,
    },
  );

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = imageConfirmResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Invalid image confirm response.",
      500,
      "Internal Server Error",
    );
  }

  return parsed.data.image;
}
