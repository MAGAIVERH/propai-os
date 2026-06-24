import { z } from "zod";

export const ANALYTICS_RANGES = ["7d", "30d", "90d"] as const;

export const analyticsRangeSchema = z.enum(ANALYTICS_RANGES);

export type AnalyticsRange = z.infer<typeof analyticsRangeSchema>;

export const analyticsQuerySchema = z.object({
  range: analyticsRangeSchema.default("30d"),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

/** Maps a range token to its day count. */
export const ANALYTICS_RANGE_DAYS: Record<AnalyticsRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

// ── Overview KPIs ─────────────────────────────────────────────────────────────

export const analyticsOverviewSchema = z.object({
  totalLeads: z.number().int(),
  newLeads: z.number().int(),
  conversionRate: z.number().min(0).max(1),
  activeListings: z.number().int(),
  visitsThisWeek: z.number().int(),
  propertyViews: z.number().int(),
  avgDaysToClose: z.number().nullable(),
  range: analyticsRangeSchema,
});

export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;

// ── Funnel (count per pipeline stage) ─────────────────────────────────────────

export const analyticsFunnelStageSchema = z.object({
  stageId: z.uuid(),
  stageName: z.string(),
  sortOrder: z.number().int(),
  isWon: z.boolean(),
  isLost: z.boolean(),
  leadCount: z.number().int(),
});

export type AnalyticsFunnelStage = z.infer<typeof analyticsFunnelStageSchema>;

export const analyticsFunnelResponseSchema = z.object({
  stages: z.array(analyticsFunnelStageSchema),
});

export type AnalyticsFunnelResponse = z.infer<
  typeof analyticsFunnelResponseSchema
>;

// ── Per-agent performance ─────────────────────────────────────────────────────

export const analyticsAgentSchema = z.object({
  agentId: z.string(),
  agentName: z.string().nullable(),
  totalLeads: z.number().int(),
  wonLeads: z.number().int(),
  lostLeads: z.number().int(),
  conversionRate: z.number().min(0).max(1),
});

export type AnalyticsAgent = z.infer<typeof analyticsAgentSchema>;

export const analyticsAgentsResponseSchema = z.object({
  agents: z.array(analyticsAgentSchema),
});

export type AnalyticsAgentsResponse = z.infer<
  typeof analyticsAgentsResponseSchema
>;

// ── Property views time series (for the line chart) ──────────────────────────

export const analyticsViewsPointSchema = z.object({
  date: z.string(), // ISO date (YYYY-MM-DD)
  views: z.number().int(),
});

export type AnalyticsViewsPoint = z.infer<typeof analyticsViewsPointSchema>;

export const analyticsViewsResponseSchema = z.object({
  points: z.array(analyticsViewsPointSchema),
  total: z.number().int(),
});

export type AnalyticsViewsResponse = z.infer<
  typeof analyticsViewsResponseSchema
>;
