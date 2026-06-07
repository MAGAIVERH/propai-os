import type { PropertyListItem } from "@/modules/properties/types/property";

export type PropertyMetrics = {
  total: number;
  active: number;
  pending: number;
  sold: number;
};

export function computePropertyMetrics(items: PropertyListItem[]): PropertyMetrics {
  return {
    total: items.length,
    active: items.filter((item) => item.status === "active").length,
    pending: items.filter((item) => item.status === "under_contract").length,
    sold: items.filter((item) => item.status === "sold").length,
  };
}
