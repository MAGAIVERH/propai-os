import { TenantContextRequiredError, runInTenantContext } from "@propai/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { createRequirePermissionHook } from "../../plugins/require-member-role.js";

const exportQuerySchema = z.object({
  format: z.enum(["csv"]).default("csv"),
});

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }
  return request.tenantId;
}

/** RFC-4180 field escaping. */
function csvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.map(csvField).join(","));
  }
  // Leading BOM so Excel detects UTF-8.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

function sendCsv(reply: FastifyReply, filename: string, body: string): void {
  reply
    .header("Content-Type", "text/csv; charset=utf-8")
    .header("Content-Disposition", `attachment; filename="${filename}"`)
    .status(200)
    .send(body);
}

export async function registerAnalyticsExportRoutes(
  app: FastifyInstance,
): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requireAnalyticsRead = createRequirePermissionHook("analytics:read");

  // GET /analytics/export/leads?format=csv
  zodApp.get(
    "/analytics/export/leads",
    {
      schema: { querystring: exportQuerySchema },
      preHandler: requireAnalyticsRead,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = request.session?.user.id;
      const agentScoped = request.memberRole === "agent" && userId;

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx.execute<{
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          source: string | null;
          stage: string | null;
          ai_score: number | null;
          created_at: string;
        }>(sql`
          SELECT l.id, l.first_name, l.last_name, l.email, l.phone,
                 l.source, ps.name AS stage, l.ai_score, l.created_at
          FROM leads l
          LEFT JOIN pipeline_stages ps ON ps.id = l.stage_id
          WHERE l.soft_deleted_at IS NULL
            ${agentScoped ? sql`AND l.assigned_agent_id = ${userId}` : sql``}
          ORDER BY l.created_at DESC
        `);
      });

      const csv = toCsv(
        ["ID", "First Name", "Last Name", "Email", "Phone", "Source", "Stage", "AI Score", "Created At"],
        rows.map((r) => [
          r.id,
          r.first_name,
          r.last_name,
          r.email,
          r.phone,
          r.source,
          r.stage,
          r.ai_score,
          r.created_at,
        ]),
      );

      sendCsv(reply, "leads.csv", csv);
    },
  );

  // GET /analytics/export/properties?format=csv
  zodApp.get(
    "/analytics/export/properties",
    {
      schema: { querystring: exportQuerySchema },
      preHandler: requireAnalyticsRead,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = request.session?.user.id;
      const agentScoped = request.memberRole === "agent" && userId;

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx.execute<{
          id: string;
          title: string;
          type: string;
          status: string;
          price_usd_cents: number;
          rent_or_sale: string;
          bedrooms: number;
          bathrooms: string;
          sq_ft: number;
          city: string;
          state: string;
          zip_code: string;
          created_at: string;
        }>(sql`
          SELECT id, title, type, status, price_usd_cents, rent_or_sale,
                 bedrooms, bathrooms, sq_ft, city, state, zip_code, created_at
          FROM properties
          WHERE soft_deleted_at IS NULL
            ${agentScoped ? sql`AND created_by = ${userId}` : sql``}
          ORDER BY created_at DESC
        `);
      });

      const csv = toCsv(
        ["ID", "Title", "Type", "Status", "Price USD", "Rent/Sale", "Beds", "Baths", "Sq Ft", "City", "State", "ZIP", "Created At"],
        rows.map((r) => [
          r.id,
          r.title,
          r.type,
          r.status,
          (Number(r.price_usd_cents) / 100).toFixed(2),
          r.rent_or_sale,
          r.bedrooms,
          r.bathrooms,
          r.sq_ft,
          r.city,
          r.state,
          r.zip_code,
          r.created_at,
        ]),
      );

      sendCsv(reply, "properties.csv", csv);
    },
  );
}
