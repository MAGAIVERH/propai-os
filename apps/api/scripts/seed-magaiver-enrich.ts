/**
 * Enriches the already-seeded "magaiver test" tenant so EVERY dashboard metric
 * and chart lights up:
 *  - adds a second agent and reassigns some leads (agent leaderboard shows 2)
 *  - backdates won leads' updated_at (avg days-to-close becomes realistic)
 *  - adds visit_scheduled activities within the last 7 days (visits this week)
 *
 * Run:  pnpm --filter @propai/api tsx scripts/seed-magaiver-enrich.ts
 * Idempotent: reuses the agent by email and only adds this-week visits once.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  closeDb,
  getDb,
  leadActivities,
  leads,
  member,
  pipelineStages,
  runInTenantContext,
  user,
} from "@propai/db";
import { and, eq, inArray, sql } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");

function loadRootEnv() {
  const envPath = resolve(REPO_ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}
loadRootEnv();

const TENANT_ID = (process.env.SEED_TENANT_ID ?? "843f3fa5-5aa7-4ba9-8b80-c8c552cd8b55").toLowerCase();
const AGENT_EMAIL = "john.martinez@magaiver.demo";
const AGENT_NAME = "John Martinez";

async function main() {
  const db = getDb();

  // 1) Ensure a second agent (user + member) exists.
  let agentId: string;
  const existingUser = await db.select({ id: user.id }).from(user).where(eq(user.email, AGENT_EMAIL)).limit(1);
  if (existingUser[0]) {
    agentId = existingUser[0].id;
  } else {
    agentId = randomUUID();
    await db.insert(user).values({
      id: agentId,
      name: AGENT_NAME,
      email: AGENT_EMAIL,
      emailVerified: true,
    });
  }
  const existingMember = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, TENANT_ID), eq(member.userId, agentId)))
    .limit(1);
  if (!existingMember[0]) {
    await db.insert(member).values({
      id: randomUUID(),
      organizationId: TENANT_ID,
      userId: agentId,
      role: "agent",
    });
  }

  // 2) Reassign every other lead to the agent, and find the "won" stage.
  const stages = await runInTenantContext(TENANT_ID, (tx) =>
    tx.select({ id: pipelineStages.id, isWon: pipelineStages.isWon }).from(pipelineStages),
  );
  const wonStageIds = stages.filter((s) => s.isWon).map((s) => s.id);

  const allLeads = await runInTenantContext(TENANT_ID, (tx) =>
    tx.select({ id: leads.id, createdAt: leads.createdAt }).from(leads).orderBy(leads.createdAt),
  );
  const toAgent = allLeads.filter((_, i) => i % 2 === 0).map((l) => l.id);
  if (toAgent.length > 0) {
    await runInTenantContext(TENANT_ID, (tx) =>
      tx.update(leads).set({ assignedAgentId: agentId }).where(inArray(leads.id, toAgent)),
    );
  }

  // 3) Backdate won leads' updated_at so avg days-to-close is realistic (capped past).
  let closedFixed = 0;
  if (wonStageIds.length > 0) {
    const res = await runInTenantContext(TENANT_ID, (tx) =>
      tx
        .update(leads)
        .set({ updatedAt: sql`LEAST(now() - interval '2 days', ${leads.createdAt} + interval '16 days')` })
        .where(and(eq(leads.tenantId, TENANT_ID), inArray(leads.stageId, wonStageIds)))
        .returning({ id: leads.id }),
    );
    closedFixed = res.length;
  }

  // 4) Add visits within the last 7 days (visits this week) — only if none yet.
  const recentVisits = await runInTenantContext(TENANT_ID, (tx) =>
    tx.execute<{ n: number }>(sql`
      SELECT COUNT(*)::int AS n
      FROM lead_activities la JOIN leads l ON l.id = la.lead_id
      WHERE l.tenant_id = ${TENANT_ID} AND la.type = 'visit_scheduled'
        AND la.created_at >= now() - interval '7 days'
    `),
  );
  let visitsAdded = 0;
  const alreadyThisWeek = Number((recentVisits as unknown as { n: number }[])[0]?.n ?? 0);
  if (alreadyThisWeek === 0 && allLeads.length >= 3) {
    const targets = [allLeads[0], allLeads[2], allLeads[4]].filter(Boolean) as { id: string }[];
    const offsets = [1, 3, 5];
    for (let i = 0; i < targets.length; i++) {
      const when = new Date();
      when.setDate(when.getDate() - offsets[i]!);
      when.setHours(15, 0, 0, 0);
      await runInTenantContext(TENANT_ID, (tx) =>
        tx.insert(leadActivities).values({
          leadId: targets[i]!.id,
          type: "visit_scheduled",
          content: "Property showing scheduled with the buyer.",
          createdBy: agentId,
          createdAt: when,
        }),
      );
      visitsAdded += 1;
    }
  }

  console.log("\nEnrichment complete — magaiver test Brokerage\n");
  console.log(`  Agent:                ${AGENT_NAME} (${agentId})`);
  console.log(`  Leads reassigned:     ${toAgent.length}`);
  console.log(`  Won leads dated:      ${closedFixed}`);
  console.log(`  This-week visits:     ${visitsAdded} (already had ${alreadyThisWeek})\n`);
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
    await closeDb();
    process.exit(1);
  });
