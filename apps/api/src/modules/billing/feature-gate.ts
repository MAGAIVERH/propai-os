import { PLAN_LIMITS } from "@propai/shared";

import { countActiveListings, countAgents, getTenantBilling } from "./queries/billing-status.js";

export type LimitCheck = {
  allowed: boolean;
  limit: number | null;
  current: number;
};

/**
 * Checks whether the tenant can have one more active listing. Pass
 * `alreadyActive: true` when the property in question is already counted as
 * active (e.g. editing an active listing) so it isn't double-counted.
 */
export async function checkListingLimit(
  tenantId: string,
  alreadyActive = false,
): Promise<LimitCheck> {
  const billing = await getTenantBilling(tenantId);
  const limit = PLAN_LIMITS[billing.plan].activeListings;
  const current = await countActiveListings(tenantId);

  if (limit === null) {
    return { allowed: true, limit, current };
  }
  // Already-active listings don't consume an additional slot.
  const effective = alreadyActive ? current - 1 : current;
  return { allowed: effective < limit, limit, current };
}

/** Checks whether the tenant can add one more team member. */
export async function checkAgentLimit(tenantId: string): Promise<LimitCheck> {
  const billing = await getTenantBilling(tenantId);
  const limit = PLAN_LIMITS[billing.plan].agents;
  const current = await countAgents(tenantId);

  if (limit === null) {
    return { allowed: true, limit, current };
  }
  return { allowed: current < limit, limit, current };
}
