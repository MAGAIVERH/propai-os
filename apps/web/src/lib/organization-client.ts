import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";
import type { OrganizationProfile } from "@/types/organization";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseOrganizationProfile(value: unknown): OrganizationProfile | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const name = readString(value.name);
  const slug = readString(value.slug);

  if (!id || !name || !slug) {
    return null;
  }

  return { id, name, slug };
}

export async function getOrganizationMe(): Promise<OrganizationProfile> {
  const response = await apiFetch("/v1/organization/me", {
    method: "GET",
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const organization = parseOrganizationProfile(body);

  if (!organization) {
    throw new ApiClientError(
      "Invalid organization response.",
      500,
      "Internal Server Error",
    );
  }

  return organization;
}
