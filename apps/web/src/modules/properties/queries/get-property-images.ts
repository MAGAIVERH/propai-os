import {
  propertyImageListResponseSchema,
  type PropertyImageResponse,
} from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";

export async function getPropertyImages(
  propertyId: string,
): Promise<PropertyImageResponse[]> {
  const response = await apiFetch(`/v1/properties/${propertyId}/images`, {
    method: "GET",
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = propertyImageListResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Invalid property images response.",
      500,
      "Internal Server Error",
    );
  }

  return parsed.data.items;
}
