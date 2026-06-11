import type { CreatePropertyFormValues } from "@/modules/properties/schemas/create-property";

export const AI_PROPERTY_PREFILL_STORAGE_KEY = "propai:ai-property-prefill";

type AiPropertyPrefillStore = Record<string, Partial<CreatePropertyFormValues>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStore(): AiPropertyPrefillStore {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.sessionStorage.getItem(AI_PROPERTY_PREFILL_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed)) {
      return {};
    }

    return parsed as AiPropertyPrefillStore;
  } catch {
    return {};
  }
}

function writeStore(store: AiPropertyPrefillStore): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    AI_PROPERTY_PREFILL_STORAGE_KEY,
    JSON.stringify(store),
  );
}

export function readAiPropertyPrefill(
  propertyId: string,
): Partial<CreatePropertyFormValues> | null {
  const store = readStore();
  return store[propertyId] ?? null;
}

export function writeAiPropertyPrefill(
  propertyId: string,
  values: Partial<CreatePropertyFormValues>,
): void {
  const store = readStore();
  store[propertyId] = values;
  writeStore(store);
}

export function clearAiPropertyPrefill(propertyId: string): void {
  const store = readStore();

  if (!(propertyId in store)) {
    return;
  }

  delete store[propertyId];
  writeStore(store);
}
