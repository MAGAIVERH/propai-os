import {
  estimatePriceResponseSchema,
  type EstimatePriceRequest,
  type EstimatePriceResponse,
} from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";

export async function estimatePropertyPrice(
  input: EstimatePriceRequest,
): Promise<EstimatePriceResponse> {
  const response = await apiFetch("/v1/ai/estimate-price", {
    method: "POST",
    json: input,
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = estimatePriceResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Invalid price estimate response.",
      500,
      "Internal Server Error",
    );
  }

  return parsed.data;
}
