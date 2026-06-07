import { propertyStatusSchema } from "@propai/shared";
import { z } from "zod";

export const propertiesListFiltersSchema = z.object({
  status: propertyStatusSchema.optional(),
});

export type PropertiesListFilters = z.infer<typeof propertiesListFiltersSchema>;

export function parsePropertiesListFilters(
  searchParams: Record<string, string | string[] | undefined>,
): PropertiesListFilters {
  const rawStatus = searchParams.status;
  const status = typeof rawStatus === "string" ? rawStatus : undefined;

  const parsed = propertiesListFiltersSchema.safeParse({ status });

  if (!parsed.success) {
    return {};
  }

  return parsed.data;
}

export function propertiesListFiltersToQuery(
  filters: PropertiesListFilters,
): { status?: PropertiesListFilters["status"]; limit: number } {
  return {
    limit: 100,
    ...(filters.status ? { status: filters.status } : {}),
  };
}
