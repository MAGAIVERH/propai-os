import {
  propertyCreateResponseSchema,
  type CreatePropertyInput,
  type PropertyResponse,
} from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";

export async function createProperty(
  input: CreatePropertyInput,
): Promise<PropertyResponse> {
  const response = await apiFetch("/v1/properties", {
    method: "POST",
    json: input,
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = propertyCreateResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Resposta inválida ao criar imóvel.",
      500,
      "Internal Server Error",
    );
  }

  return parsed.data.property;
}
