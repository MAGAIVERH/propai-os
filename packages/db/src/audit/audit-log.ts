import type { AuditAction } from "@propai/shared";

import { runInTenantContext } from "../tenant-context.js";
import { auditLogs } from "../schema/audit-logs.js";

export type LogAuditEventInput = {
  tenantId: string;
  actorId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

export type LogAuditEventResult =
  | { success: true; id: string }
  | { success: false; message: string };

/**
 * Persists an audit event inside tenant RLS scope.
 * Never throws — callers in routes should check `success`.
 */
export async function logAuditEvent(
  input: LogAuditEventInput,
): Promise<LogAuditEventResult> {
  try {
    const row = await runInTenantContext(input.tenantId, async (tx) => {
      const [inserted] = await tx
        .insert(auditLogs)
        .values({
          tenantId: input.tenantId,
          actorId: input.actorId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata ?? {},
          ip: input.ip ?? null,
        })
        .returning({ id: auditLogs.id });

      return inserted;
    });

    if (!row) {
      return { success: false, message: "Falha ao registrar evento de auditoria." };
    }

    return { success: true, id: row.id };
  } catch (error) {
    console.error("logAuditEvent failed", error);
    return { success: false, message: "Falha ao registrar evento de auditoria." };
  }
}

export { logAuditEvent as auditLog };
