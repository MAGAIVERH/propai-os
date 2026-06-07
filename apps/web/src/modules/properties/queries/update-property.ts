import {
  propertyCreateResponseSchema,
  type PropertyResponse,
  type UpdatePropertyInput,
} from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput,
): Promise<PropertyResponse> {
  const response = await apiFetch(`/v1/properties/${id}`, {
    method: "PATCH",
    json: input,
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = propertyCreateResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Invalid update property response.",
      500,
      "Internal Server Error",
    );
  }

  return parsed.data.property;
}
