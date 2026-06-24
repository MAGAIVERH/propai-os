import { z } from "zod";

import { brokerageRoleSchema } from "../roles/permissions.js";

// ── Team management (Day 63) ──────────────────────────────────────────────────

export const teamMemberStatusSchema = z.enum(["active", "pending"]);

export type TeamMemberStatus = z.infer<typeof teamMemberStatusSchema>;

export const teamMemberSchema = z.object({
  /** member.id for active members, invitation.id for pending invites. */
  id: z.string(),
  userId: z.string().nullable(),
  name: z.string().nullable(),
  email: z.string(),
  role: brokerageRoleSchema,
  status: teamMemberStatusSchema,
  createdAt: z.iso.datetime().nullable(),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;

export const teamListResponseSchema = z.object({
  members: z.array(teamMemberSchema),
});

export type TeamListResponse = z.infer<typeof teamListResponseSchema>;

/** Roles an owner can assign when inviting/updating (not "owner"). */
export const assignableRoleSchema = z.enum(["manager", "agent", "viewer"]);

export type AssignableRole = z.infer<typeof assignableRoleSchema>;

export const inviteMemberSchema = z.object({
  email: z.email("A valid email is required"),
  role: assignableRoleSchema,
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: assignableRoleSchema,
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

// ── Tenant settings + branding (Day 64) ──────────────────────────────────────

export const tenantSettingsResponseSchema = z.object({
  organizationId: z.uuid(),
  agencyName: z.string(),
  slug: z.string(),
  timezone: z.string(),
  currency: z.string(),
  logoUrl: z.string().nullable(),
  primaryColor: z.string(),
  marketplaceSlug: z.string().nullable(),
  onboardingCompletedAt: z.iso.datetime().nullable(),
});

export type TenantSettingsResponse = z.infer<typeof tenantSettingsResponseSchema>;

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color, e.g. #10b981");

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only")
  .min(2)
  .max(50);

export const updateTenantSettingsSchema = z.object({
  agencyName: z.string().trim().min(1).max(120).optional(),
  timezone: z.string().trim().min(1).optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: hexColorSchema.optional(),
  marketplaceSlug: slugSchema.nullable().optional(),
});

export type UpdateTenantSettingsInput = z.infer<typeof updateTenantSettingsSchema>;

// ── Onboarding (Day 62) ──────────────────────────────────────────────────────

export const onboardingStatusSchema = z.object({
  completed: z.boolean(),
  steps: z.object({
    agencyConfigured: z.boolean(),
    agentInvited: z.boolean(),
    propertyAdded: z.boolean(),
  }),
});

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export const completeOnboardingSchema = z.object({
  agencyName: z.string().trim().min(1).max(120).optional(),
  timezone: z.string().trim().min(1).optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
