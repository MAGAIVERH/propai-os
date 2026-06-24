import { z } from "zod";

export const BILLING_PLANS = ["free", "pro"] as const;

export const billingPlanSchema = z.enum(BILLING_PLANS);

export type BillingPlan = z.infer<typeof billingPlanSchema>;

export type PlanLimits = {
  /** Max active listings, or null for unlimited. */
  activeListings: number | null;
  /** Max team members (agents), or null for unlimited. */
  agents: number | null;
};

/** Free vs Pro entitlements (Day 60). */
export const PLAN_LIMITS: Record<BillingPlan, PlanLimits> = {
  free: { activeListings: 5, agents: 2 },
  pro: { activeListings: null, agents: null },
};

export const PRO_PRICE_USD_PER_MONTH = 49;

export function isOverLimit(used: number, limit: number | null): boolean {
  return limit !== null && used >= limit;
}

export const billingUsageSchema = z.object({
  activeListings: z.number().int(),
  agents: z.number().int(),
});

export type BillingUsage = z.infer<typeof billingUsageSchema>;

export const billingStatusSchema = z.object({
  plan: billingPlanSchema,
  subscriptionStatus: z.string(),
  usage: billingUsageSchema,
  limits: z.object({
    activeListings: z.number().int().nullable(),
    agents: z.number().int().nullable(),
  }),
  overListingLimit: z.boolean(),
  overAgentLimit: z.boolean(),
  /** True when Stripe keys are configured and checkout/portal are usable. */
  billingEnabled: z.boolean(),
});

export type BillingStatus = z.infer<typeof billingStatusSchema>;

export const checkoutResponseSchema = z.object({ url: z.string() });

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

export const portalResponseSchema = z.object({ url: z.string() });

export type PortalResponse = z.infer<typeof portalResponseSchema>;
