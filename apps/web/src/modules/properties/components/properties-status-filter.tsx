"use client";

import { PROPERTY_STATUSES } from "@propai/shared";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getPropertyStatusLabel } from "@/modules/properties/lib/format-property";
import type { PropertiesListFilters } from "@/modules/properties/schemas/list-filters";

type PropertiesStatusFilterProps = {
  filters: PropertiesListFilters;
};

export function PropertiesStatusFilter({ filters }: PropertiesStatusFilterProps) {
  const router = useRouter();
  const activeStatus = filters.status;

  function navigateToStatus(status?: PropertiesListFilters["status"]) {
    if (!status) {
      router.push("/properties");
      return;
    }

    router.push(`/properties?status=${status}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={activeStatus === undefined ? "default" : "outline"}
        onClick={() => navigateToStatus(undefined)}
      >
        All
      </Button>
      {PROPERTY_STATUSES.map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant={activeStatus === status ? "default" : "outline"}
          onClick={() => navigateToStatus(status)}
        >
          {getPropertyStatusLabel(status)}
        </Button>
      ))}
    </div>
  );
}
