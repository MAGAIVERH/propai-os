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
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Button
        type="button"
        size="sm"
        variant={activeStatus === undefined ? "default" : "outline"}
        onClick={() => navigateToStatus(undefined)}
        className="shrink-0"
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
          className="shrink-0"
        >
          {getPropertyStatusLabel(status)}
        </Button>
      ))}
    </div>
  );
}
