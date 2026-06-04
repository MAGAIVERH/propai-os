import { getDb, invitation } from "@propai/db";
import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify";

import { getSessionFromRequest } from "../modules/auth/session.js";
import { writeAuditEventSafe } from "./write-audit-event.js";

type AcceptInvitationBody = {
  invitationId?: string;
};

function parseInvitationIdFromBody(body: unknown): string | null {
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body) as AcceptInvitationBody;
      return typeof parsed.invitationId === "string" ? parsed.invitationId : null;
    } catch {
      return null;
    }
  }

  if (body && typeof body === "object" && "invitationId" in body) {
    const value = (body as AcceptInvitationBody).invitationId;
    return typeof value === "string" ? value : null;
  }

  return null;
}

export async function tryAuditInvitationAccepted(
  request: FastifyRequest,
  responseStatus: number,
  requestBody: unknown,
): Promise<void> {
  if (responseStatus !== 200) {
    return;
  }

  const invitationId = parseInvitationIdFromBody(requestBody);

  if (!invitationId) {
    return;
  }

  const session = await getSessionFromRequest(request);

  if (!session) {
    return;
  }

  const [row] = await getDb()
    .select({
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
    })
    .from(invitation)
    .where(eq(invitation.id, invitationId))
    .limit(1);

  if (!row) {
    return;
  }

  await writeAuditEventSafe({
    tenantId: row.organizationId,
    actorId: session.user.id,
    action: "invitation.accepted",
    entityType: "invitation",
    entityId: invitationId,
    metadata: {
      email: row.email,
      role: row.role,
    },
    ip: request.ip,
  });
}
