import { logAuditEvent, type LogAuditEventInput } from "@propai/db";

/** Persists audit events without failing the caller route or auth handler. */
export async function writeAuditEventSafe(
  input: LogAuditEventInput,
): Promise<void> {
  const result = await logAuditEvent(input);

  if (!result.success) {
    console.error(
      `Failed to write audit log (${input.action}):`,
      result.message,
    );
  }
}
