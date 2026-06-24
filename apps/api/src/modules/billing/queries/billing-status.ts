import { getDb, member, properties, runInTenantContext, tenantSettings, user } from "@propai/db";
import { PLAN_LIMITS, isOverLimit, type BillingPlan, type BillingStatus } from "@propai/shared";
import { and, count, eq, isNull } from "drizzle-orm";

import { isBillingEnabled } from "../../../lib/stripe-client.js";

export type TenantBilling = {
  plan: BillingPlan;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

/** Reads the billing-relevant columns from tenant_settings (admin, no RLS). */
export async function getTenantBilling(tenantId: string): Promise<TenantBilling> {
  const db = getDb();
  const rows = await db
    .select({
      plan: tenantSettings.plan,
      subscriptionStatus: tenantSettings.subscriptionStatus,
      stripeCustomerId: tenantSettings.stripeCustomerId,
      stripeSubscriptionId: tenantSettings.stripeSubscriptionId,
    })
    .from(tenantSettings)
    .where(eq(tenantSettings.organizationId, tenantId))
    .limit(1);

  const row = rows[0];
  return {
    plan: (row?.plan as BillingPlan) ?? "free",
    subscriptionStatus: row?.subscriptionStatus ?? "inactive",
    stripeCustomerId: row?.stripeCustomerId ?? null,
    stripeSubscriptionId: row?.stripeSubscriptionId ?? null,
  };
}

export async function countActiveListings(tenantId: string): Promise<number> {
  // properties enforces RLS → must run inside tenant context.
  const rows = await runInTenantContext(tenantId, async (tx) => {
    return tx
      .select({ value: count() })
      .from(properties)
      .where(and(eq(properties.status, "active"), isNull(properties.softDeletedAt)));
  });
  return Number(rows[0]?.value ?? 0);
}

/** Looks up a user's email (for Stripe customer creation). */
export async function getUserEmail(userId: string): Promise<string | undefined> {
  const rows = await getDb()
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return rows[0]?.email;
}

export async function countAgents(tenantId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ value: count() })
    .from(member)
    .where(eq(member.organizationId, tenantId));
  return Number(rows[0]?.value ?? 0);
}

export async function getBillingStatus(tenantId: string): Promise<BillingStatus> {
  const [billing, activeListings, agents] = await Promise.all([
    getTenantBilling(tenantId),
    countActiveListings(tenantId),
    countAgents(tenantId),
  ]);

  const limits = PLAN_LIMITS[billing.plan];

  return {
    plan: billing.plan,
    subscriptionStatus: billing.subscriptionStatus,
    usage: { activeListings, agents },
    limits: { activeListings: limits.activeListings, agents: limits.agents },
    overListingLimit: isOverLimit(activeListings, limits.activeListings),
    overAgentLimit: isOverLimit(agents, limits.agents),
    billingEnabled: isBillingEnabled(),
  };
}
