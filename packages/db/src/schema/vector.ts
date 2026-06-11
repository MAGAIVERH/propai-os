import { customType } from "drizzle-orm/pg-core";

/** OpenAI text-embedding-3-small output (1536 dimensions). */
export type Vector1536 = number[];

function parsePgVector(value: string): Vector1536 {
  const trimmed = value.trim();

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();

    if (inner.length === 0) {
      return [];
    }

    return inner.split(",").map((part) => Number.parseFloat(part.trim()));
  }

  return JSON.parse(trimmed) as Vector1536;
}

/** pgvector column type fixed at 1536 dimensions (semantic search). */
export const vector1536 = customType<{
  data: Vector1536;
  driverData: string;
}>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: Vector1536): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): Vector1536 {
    return parsePgVector(value);
  },
});
