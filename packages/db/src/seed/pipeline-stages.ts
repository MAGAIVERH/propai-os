import { getAppDb } from "../client.js";
import { pipelineStages } from "../schema/crm.js";
import { runInTenantContext } from "../tenant-context.js";

export const DEFAULT_PIPELINE_STAGES = [
  { name: "New",              sortOrder: 0, color: "#6B7280", isWon: false, isLost: false },
  { name: "Contacted",        sortOrder: 1, color: "#3B82F6", isWon: false, isLost: false },
  { name: "Visit Scheduled",  sortOrder: 2, color: "#8B5CF6", isWon: false, isLost: false },
  { name: "Negotiation",      sortOrder: 3, color: "#F59E0B", isWon: false, isLost: false },
  { name: "Won",              sortOrder: 4, color: "#10B981", isWon: true,  isLost: false },
  { name: "Lost",             sortOrder: 5, color: "#EF4444", isWon: false, isLost: true  },
] as const;

/**
 * Seeds the six default pipeline stages for a new tenant.
 * Safe to call multiple times — skips on conflict (stage already exists for tenant).
 */
export async function seedDefaultPipelineStages(tenantId: string): Promise<void> {
  const db = getAppDb();

  await runInTenantContext(tenantId, async (tx) => {
    await tx
      .insert(pipelineStages)
      .values(
        DEFAULT_PIPELINE_STAGES.map((stage) => ({
          tenantId,
          ...stage,
        })),
      )
      .onConflictDoNothing();
  });
}
