import { getDb, member, runInTenantContext, user } from "@propai/db";
import {
  ANALYTICS_RANGE_DAYS,
  type AnalyticsAgent,
  type AnalyticsFunnelStage,
  type AnalyticsOverview,
  type AnalyticsRange,
  type AnalyticsViewsPoint,
} from "@propai/shared";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * `agentId` scopes results to a single agent (RBAC: agents see only their own
 * metrics). Undefined means tenant-wide (managers/owners/viewers).
 */
export type AnalyticsScope = {
  tenantId: string;
  agentId?: string;
};

function agentFilter(agentId: string | undefined) {
  return agentId ? sql` AND assigned_agent_id = ${agentId}` : sql``;
}

export async function getOverview(
  scope: AnalyticsScope,
  range: AnalyticsRange,
): Promise<AnalyticsOverview> {
  const days = ANALYTICS_RANGE_DAYS[range];
  const af = agentFilter(scope.agentId);

  return runInTenantContext(scope.tenantId, async (tx) => {
    const leadRows = await tx.execute<{
      total_leads: number;
      new_leads: number;
      won_leads: number;
    }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE soft_deleted_at IS NULL)::int AS total_leads,
        COUNT(*) FILTER (WHERE soft_deleted_at IS NULL
          AND created_at >= now() - (${days} || ' days')::interval)::int AS new_leads,
        COUNT(*) FILTER (WHERE soft_deleted_at IS NULL
          AND stage_id IN (SELECT id FROM pipeline_stages WHERE is_won))::int AS won_leads
      FROM leads
      WHERE TRUE ${af}
    `);

    const listingRows = await tx.execute<{ active_listings: number }>(sql`
      SELECT COUNT(*)::int AS active_listings
      FROM properties
      WHERE status = 'active' AND soft_deleted_at IS NULL
    `);

    const visitRows = await tx.execute<{ visits_this_week: number }>(sql`
      SELECT COUNT(*)::int AS visits_this_week
      FROM lead_activities la
      JOIN leads l ON l.id = la.lead_id
      WHERE la.type = 'visit_scheduled'
        AND la.created_at >= now() - interval '7 days'
        ${scope.agentId ? sql` AND l.assigned_agent_id = ${scope.agentId}` : sql``}
    `);

    const viewRows = await tx.execute<{ property_views: number }>(sql`
      SELECT COUNT(*)::int AS property_views
      FROM analytics_events
      WHERE type = 'property_view'
        AND created_at >= now() - (${days} || ' days')::interval
    `);

    const closeRows = await tx.execute<{ avg_days: number | null }>(sql`
      SELECT avg_days FROM avg_days_to_close LIMIT 1
    `);

    const lead = leadRows[0] ?? { total_leads: 0, new_leads: 0, won_leads: 0 };
    const totalLeads = Number(lead.total_leads);
    const wonLeads = Number(lead.won_leads);
    const avgDays = closeRows[0]?.avg_days;

    return {
      totalLeads,
      newLeads: Number(lead.new_leads),
      conversionRate: totalLeads > 0 ? wonLeads / totalLeads : 0,
      activeListings: Number(listingRows[0]?.active_listings ?? 0),
      visitsThisWeek: Number(visitRows[0]?.visits_this_week ?? 0),
      propertyViews: Number(viewRows[0]?.property_views ?? 0),
      avgDaysToClose: avgDays !== null && avgDays !== undefined ? Number(avgDays) : null,
      range,
    };
  });
}

export async function getFunnel(
  scope: AnalyticsScope,
): Promise<AnalyticsFunnelStage[]> {
  return runInTenantContext(scope.tenantId, async (tx) => {
    // Managers/owners read the canonical view; agents need a self-scoped count.
    const rows = scope.agentId
      ? await tx.execute<{
          stage_id: string;
          stage_name: string;
          sort_order: number;
          is_won: boolean;
          is_lost: boolean;
          lead_count: number;
        }>(sql`
          SELECT ps.id AS stage_id, ps.name AS stage_name, ps.sort_order,
                 ps.is_won, ps.is_lost,
                 COUNT(l.id) FILTER (
                   WHERE l.soft_deleted_at IS NULL
                     AND l.assigned_agent_id = ${scope.agentId}
                 )::int AS lead_count
          FROM pipeline_stages ps
          LEFT JOIN leads l ON l.stage_id = ps.id
          GROUP BY ps.id, ps.name, ps.sort_order, ps.is_won, ps.is_lost
          ORDER BY ps.sort_order
        `)
      : await tx.execute<{
          stage_id: string;
          stage_name: string;
          sort_order: number;
          is_won: boolean;
          is_lost: boolean;
          lead_count: number;
        }>(sql`
          SELECT stage_id, stage_name, sort_order, is_won, is_lost, lead_count::int
          FROM lead_conversion_by_stage
          ORDER BY sort_order
        `);

    return rows.map((r) => ({
      stageId: r.stage_id,
      stageName: r.stage_name,
      sortOrder: Number(r.sort_order),
      isWon: r.is_won,
      isLost: r.is_lost,
      leadCount: Number(r.lead_count),
    }));
  });
}

export async function getAgents(
  scope: AnalyticsScope,
): Promise<AnalyticsAgent[]> {
  const rows = await runInTenantContext(scope.tenantId, async (tx) => {
    return tx.execute<{
      agent_id: string;
      total_leads: number;
      won_leads: number;
      lost_leads: number;
    }>(sql`
      SELECT agent_id, total_leads::int, won_leads::int, lost_leads::int
      FROM agent_performance
      ${scope.agentId ? sql`WHERE agent_id = ${scope.agentId}` : sql``}
      ORDER BY won_leads DESC, total_leads DESC
    `);
  });

  const names = await getOrgMemberNames(scope.tenantId);

  return rows.map((r) => {
    const total = Number(r.total_leads);
    const won = Number(r.won_leads);
    return {
      agentId: r.agent_id,
      agentName: names.get(r.agent_id) ?? null,
      totalLeads: total,
      wonLeads: won,
      lostLeads: Number(r.lost_leads),
      conversionRate: total > 0 ? won / total : 0,
    };
  });
}

/** Property views per day across the range (for the line chart). */
export async function getViewsSeries(
  scope: AnalyticsScope,
  range: AnalyticsRange,
): Promise<AnalyticsViewsPoint[]> {
  const days = ANALYTICS_RANGE_DAYS[range];

  return runInTenantContext(scope.tenantId, async (tx) => {
    const rows = await tx.execute<{ day: string; views: number }>(sql`
      SELECT to_char(date_trunc('day', d), 'YYYY-MM-DD') AS day,
             COUNT(ae.id)::int AS views
      FROM generate_series(
             date_trunc('day', now()) - ((${days} - 1) || ' days')::interval,
             date_trunc('day', now()),
             interval '1 day'
           ) AS d
      LEFT JOIN analytics_events ae
        ON ae.type = 'property_view'
       AND date_trunc('day', ae.created_at) = d
      GROUP BY d
      ORDER BY d
    `);

    return rows.map((r) => ({ date: r.day, views: Number(r.views) }));
  });
}

/** Maps userId → display name for the tenant's members (admin read). */
async function getOrgMemberNames(
  tenantId: string,
): Promise<Map<string, string>> {
  const db = getDb();
  const rows = await db
    .select({ userId: member.userId, name: user.name, email: user.email })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, tenantId));

  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.userId, row.name || row.email);
  }
  return map;
}
