const CURSOR_SEPARATOR = "|";

export type AuditLogCursor = {
  createdAt: Date;
  id: string;
};

export function encodeAuditLogCursor(cursor: AuditLogCursor): string {
  return `${cursor.createdAt.toISOString()}${CURSOR_SEPARATOR}${cursor.id}`;
}

export function decodeAuditLogCursor(
  value: string,
): AuditLogCursor | null {
  const separatorIndex = value.lastIndexOf(CURSOR_SEPARATOR);

  if (separatorIndex <= 0) {
    return null;
  }

  const createdAtRaw = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);
  const createdAt = new Date(createdAtRaw);

  if (Number.isNaN(createdAt.getTime()) || id.length === 0) {
    return null;
  }

  return { createdAt, id };
}
