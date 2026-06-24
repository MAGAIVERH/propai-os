"use client";

import type { AssignableRole, UpdateTenantSettingsInput } from "@propai/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changeMemberRole,
  completeOnboarding,
  getBilling,
  getOnboarding,
  getTeam,
  getTenantSettings,
  inviteMember,
  removeMember,
  updateTenantSettings,
} from "../queries/settings-api";

export const BILLING_QUERY_KEY = ["billing"] as const;
export const TEAM_QUERY_KEY = ["team"] as const;
export const SETTINGS_QUERY_KEY = ["tenant-settings"] as const;
export const ONBOARDING_QUERY_KEY = ["onboarding"] as const;

export function useBilling() {
  return useQuery({ queryKey: BILLING_QUERY_KEY, queryFn: getBilling });
}

export function useTeam() {
  return useQuery({ queryKey: TEAM_QUERY_KEY, queryFn: getTeam });
}

export function useTenantSettings() {
  return useQuery({ queryKey: SETTINGS_QUERY_KEY, queryFn: getTenantSettings });
}

export function useOnboarding() {
  return useQuery({ queryKey: ONBOARDING_QUERY_KEY, queryFn: getOnboarding });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: AssignableRole }) =>
      inviteMember(email, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_QUERY_KEY }),
  });
}

export function useChangeMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: AssignableRole }) =>
      changeMemberRole(memberId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_QUERY_KEY }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_QUERY_KEY }),
  });
}

export function useUpdateTenantSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantSettingsInput) => updateTenantSettings(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => completeOnboarding(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY }),
  });
}
