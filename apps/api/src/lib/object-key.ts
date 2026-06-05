import { randomUUID } from "node:crypto";

export type ParsedObjectKey = {
  tenantId: string;
  propertyId: string;
  fileId: string;
  ext: string;
};

export type BuildObjectKeyInput = {
  tenantId: string;
  propertyId: string;
  contentType: string;
};

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export type ObjectKeyExtension = (typeof ALLOWED_EXTENSIONS)[number];

const CONTENT_TYPE_TO_EXTENSION: Record<string, ObjectKeyExtension> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const OBJECT_KEY_PATTERN =
  /^tenant\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/property\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|jpeg|png|webp)$/i;

function normalizeContentType(contentType: string): string {
  return contentType.toLowerCase().split(";")[0]?.trim() ?? "";
}

export function contentTypeToExtension(
  contentType: string,
): ObjectKeyExtension | null {
  const normalized = normalizeContentType(contentType);
  return CONTENT_TYPE_TO_EXTENSION[normalized] ?? null;
}

function hasInvalidKeyStructure(key: string): boolean {
  const segments = key.split("/");

  if (segments.length !== 5) {
    return true;
  }

  const [root, , propertySegment] = segments;

  return root !== "tenant" || propertySegment !== "property";
}

export function buildObjectKey(input: BuildObjectKeyInput): string {
  const extension = contentTypeToExtension(input.contentType);

  if (!extension) {
    throw new Error("Unsupported image content type for object key.");
  }

  const fileId = randomUUID();

  return `tenant/${input.tenantId}/property/${input.propertyId}/${fileId}.${extension}`;
}

export function parseObjectKey(key: string): ParsedObjectKey | null {
  if (key.startsWith("/") || key.includes("..")) {
    return null;
  }

  const normalizedKey = key.toLowerCase();

  if (hasInvalidKeyStructure(normalizedKey)) {
    return null;
  }

  const match = OBJECT_KEY_PATTERN.exec(normalizedKey);

  if (!match) {
    return null;
  }

  const [, tenantId, propertyId, fileId, ext] = match;

  if (!tenantId || !propertyId || !fileId || !ext) {
    return null;
  }

  return {
    tenantId: tenantId.toLowerCase(),
    propertyId: propertyId.toLowerCase(),
    fileId: fileId.toLowerCase(),
    ext: ext.toLowerCase(),
  };
}

export function assertKeyBelongsToTenant(key: string, tenantId: string): boolean {
  const parsed = parseObjectKey(key);

  if (!parsed) {
    return false;
  }

  return parsed.tenantId === tenantId.toLowerCase();
}
