import {
  billingStatusSchema,
  checkoutResponseSchema,
  onboardingStatusSchema,
  portalResponseSchema,
  teamListResponseSchema,
  tenantSettingsResponseSchema,
  type AssignableRole,
  type BillingStatus,
  type OnboardingStatus,
  type TeamListResponse,
  type TenantSettingsResponse,
  type UpdateTenantSettingsInput,
} from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

async function getJson<T>(
  path: string,
  parse: (b: unknown) => { success: boolean; data?: T },
): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw await parseApiErrorResponse(res);
  const body: unknown = await res.json();
  const parsed = parse(body);
  if (!parsed.success || parsed.data === undefined) {
    throw new ApiClientError("Invalid response.", 500, "Internal Server Error");
  }
  return parsed.data;
}

// ── Billing ───────────────────────────────────────────────────────────────────

export function getBilling(): Promise<BillingStatus> {
  return getJson("/v1/billing", (b) => billingStatusSchema.safeParse(b));
}

export async function startCheckout(): Promise<string> {
  const res = await apiFetch("/v1/billing/checkout", { method: "POST" });
  if (!res.ok) throw await parseApiErrorResponse(res);
  const body: unknown = await res.json();
  const parsed = checkoutResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiClientError("Invalid checkout response.", 500, "Error");
  }
  return parsed.data.url;
}

export async function openPortal(): Promise<string> {
  const res = await apiFetch("/v1/billing/portal", { method: "POST" });
  if (!res.ok) throw await parseApiErrorResponse(res);
  const body: unknown = await res.json();
  const parsed = portalResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiClientError("Invalid portal response.", 500, "Error");
  }
  return parsed.data.url;
}

// ── Team ──────────────────────────────────────────────────────────────────────

export function getTeam(): Promise<TeamListResponse> {
  return getJson("/v1/team", (b) => teamListResponseSchema.safeParse(b));
}

export async function inviteMember(email: string, role: AssignableRole): Promise<void> {
  const res = await apiFetch("/api/auth/brokerage-invite", {
    method: "POST",
    json: { email, role },
  });
  if (!res.ok) throw await parseApiErrorResponse(res);
}

export async function changeMemberRole(memberId: string, role: AssignableRole): Promise<void> {
  const res = await apiFetch(`/v1/team/members/${memberId}/role`, {
    method: "PATCH",
    json: { role },
  });
  if (!res.ok) throw await parseApiErrorResponse(res);
}

export async function removeMember(memberId: string): Promise<void> {
  const res = await apiFetch(`/v1/team/members/${memberId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw await parseApiErrorResponse(res);
}

// ── Settings / branding ───────────────────────────────────────────────────────

export function getTenantSettings(): Promise<TenantSettingsResponse> {
  return getJson("/v1/settings", (b) => tenantSettingsResponseSchema.safeParse(b));
}

export async function updateTenantSettings(
  input: UpdateTenantSettingsInput,
): Promise<TenantSettingsResponse> {
  const res = await apiFetch("/v1/settings", { method: "PATCH", json: input });
  if (!res.ok) throw await parseApiErrorResponse(res);
  const body: unknown = await res.json();
  const parsed = tenantSettingsResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiClientError("Invalid settings response.", 500, "Error");
  }
  return parsed.data;
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export function getOnboarding(): Promise<OnboardingStatus> {
  return getJson("/v1/onboarding", (b) => onboardingStatusSchema.safeParse(b));
}

export async function completeOnboarding(): Promise<OnboardingStatus> {
  const res = await apiFetch("/v1/onboarding/complete", { method: "POST" });
  if (!res.ok) throw await parseApiErrorResponse(res);
  const body: unknown = await res.json();
  const parsed = onboardingStatusSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiClientError("Invalid onboarding response.", 500, "Error");
  }
  return parsed.data;
}
