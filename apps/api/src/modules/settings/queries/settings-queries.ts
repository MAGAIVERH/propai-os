import {
  getDb,
  invitation,
  member,
  organization,
  properties,
  runInTenantContext,
  tenantSettings,
  user,
} from "@propai/db";
import {
  parseBrokerageRole,
  type BrokerageRole,
  type OnboardingStatus,
  type TeamMember,
  type TenantSettingsResponse,
  type UpdateTenantSettingsInput,
} from "@propai/shared";
import { and, count, eq, isNull } from "drizzle-orm";

function asRole(value: string | null, fallback: BrokerageRole): BrokerageRole {
  return (value ? parseBrokerageRole(value) : null) ?? fallback;
}

/** Lists active members + pending invitations for a tenant. */
export async function listTeam(tenantId: string): Promise<TeamMember[]> {
  const db = getDb();

  const memberRows = await db
    .select({
      id: member.id,
      userId: member.userId,
      name: user.name,
      email: user.email,
      role: member.role,
      createdAt: member.createdAt,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, tenantId));

  const inviteRows = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      createdAt: invitation.createdAt,
    })
    .from(invitation)
    .where(and(eq(invitation.organizationId, tenantId), eq(invitation.status, "pending")));

  const members: TeamMember[] = memberRows.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.name,
    email: m.email,
    role: asRole(m.role, "agent"),
    status: "active" as const,
    createdAt: m.createdAt ? m.createdAt.toISOString() : null,
  }));

  const invites: TeamMember[] = inviteRows.map((i) => ({
    id: i.id,
    userId: null,
    name: null,
    email: i.email,
    role: asRole(i.role, "agent"),
    status: "pending" as const,
    createdAt: i.createdAt ? i.createdAt.toISOString() : null,
  }));

  // Owners first, then by name; pending invites after active members.
  const roleRank: Record<BrokerageRole, number> = {
    owner: 0,
    manager: 1,
    agent: 2,
    viewer: 3,
  };
  members.sort(
    (a, b) => roleRank[a.role] - roleRank[b.role] || (a.name ?? "").localeCompare(b.name ?? ""),
  );

  return [...members, ...invites];
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettingsResponse | null> {
  const db = getDb();
  const rows = await db
    .select({
      organizationId: tenantSettings.organizationId,
      agencyName: organization.name,
      slug: organization.slug,
      timezone: tenantSettings.timezone,
      currency: tenantSettings.currency,
      logoUrl: tenantSettings.logoUrl,
      primaryColor: tenantSettings.primaryColor,
      marketplaceSlug: tenantSettings.marketplaceSlug,
      onboardingCompletedAt: tenantSettings.onboardingCompletedAt,
    })
    .from(tenantSettings)
    .innerJoin(organization, eq(organization.id, tenantSettings.organizationId))
    .where(eq(tenantSettings.organizationId, tenantId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    organizationId: row.organizationId,
    agencyName: row.agencyName,
    slug: row.slug,
    timezone: row.timezone,
    currency: row.currency,
    logoUrl: row.logoUrl,
    primaryColor: row.primaryColor,
    marketplaceSlug: row.marketplaceSlug,
    onboardingCompletedAt: row.onboardingCompletedAt
      ? row.onboardingCompletedAt.toISOString()
      : null,
  };
}

export type MarketplaceSlugTaken = { taken: true };

/** Updates tenant settings (+ org name). Returns null if slug is taken. */
export async function updateTenantSettings(
  tenantId: string,
  input: UpdateTenantSettingsInput,
): Promise<TenantSettingsResponse | MarketplaceSlugTaken | null> {
  const db = getDb();

  if (input.marketplaceSlug) {
    const existing = await db
      .select({ id: tenantSettings.organizationId })
      .from(tenantSettings)
      .where(eq(tenantSettings.marketplaceSlug, input.marketplaceSlug))
      .limit(1);
    if (existing[0] && existing[0].id !== tenantId) {
      return { taken: true };
    }
  }

  const settingsPatch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.timezone !== undefined) settingsPatch.timezone = input.timezone;
  if (input.logoUrl !== undefined) settingsPatch.logoUrl = input.logoUrl;
  if (input.primaryColor !== undefined) settingsPatch.primaryColor = input.primaryColor;
  if (input.marketplaceSlug !== undefined) settingsPatch.marketplaceSlug = input.marketplaceSlug;

  await db
    .update(tenantSettings)
    .set(settingsPatch)
    .where(eq(tenantSettings.organizationId, tenantId));

  if (input.agencyName !== undefined) {
    await db
      .update(organization)
      .set({ name: input.agencyName })
      .where(eq(organization.id, tenantId));
  }

  return getTenantSettings(tenantId);
}

export async function getOnboardingStatus(tenantId: string): Promise<OnboardingStatus> {
  const db = getDb();

  const [settingsRows, memberRows, inviteRows] = await Promise.all([
    db
      .select({ completedAt: tenantSettings.onboardingCompletedAt })
      .from(tenantSettings)
      .where(eq(tenantSettings.organizationId, tenantId))
      .limit(1),
    db.select({ value: count() }).from(member).where(eq(member.organizationId, tenantId)),
    db
      .select({ value: count() })
      .from(invitation)
      .where(and(eq(invitation.organizationId, tenantId), eq(invitation.status, "pending"))),
  ]);

  const propertyRows = await runInTenantContext(tenantId, async (tx) => {
    return tx.select({ value: count() }).from(properties).where(isNull(properties.softDeletedAt));
  });

  const completedAt = settingsRows[0]?.completedAt ?? null;
  const memberCount = Number(memberRows[0]?.value ?? 0);
  const inviteCount = Number(inviteRows[0]?.value ?? 0);
  const propertyCount = Number(propertyRows[0]?.value ?? 0);

  return {
    completed: completedAt !== null,
    steps: {
      agencyConfigured: completedAt !== null,
      // More than just the owner, or a pending invite.
      agentInvited: memberCount > 1 || inviteCount > 0,
      propertyAdded: propertyCount > 0,
    },
  };
}

export async function markOnboardingComplete(tenantId: string): Promise<void> {
  await getDb()
    .update(tenantSettings)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(tenantSettings.organizationId, tenantId));
}

export async function updateMemberRole(
  tenantId: string,
  memberId: string,
  role: BrokerageRole,
): Promise<boolean> {
  const db = getDb();
  const updated = await db
    .update(member)
    .set({ role })
    .where(and(eq(member.id, memberId), eq(member.organizationId, tenantId)))
    .returning({ id: member.id });
  return updated.length > 0;
}

export async function removeMember(
  tenantId: string,
  memberId: string,
): Promise<{ removed: boolean; wasOwner: boolean }> {
  const db = getDb();
  const rows = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.id, memberId), eq(member.organizationId, tenantId)))
    .limit(1);

  const target = rows[0];
  if (!target) return { removed: false, wasOwner: false };
  if (target.role === "owner") return { removed: false, wasOwner: true };

  await db.delete(member).where(and(eq(member.id, memberId), eq(member.organizationId, tenantId)));
  return { removed: true, wasOwner: false };
}
