"use client";

import { Building, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api-client";
import { PropertiesList } from "@/modules/properties/components/properties-list";
import { PropertiesMetrics } from "@/modules/properties/components/properties-metrics";
import { PropertiesStatusFilter } from "@/modules/properties/components/properties-status-filter";
import { PropertiesTableSkeleton } from "@/modules/properties/components/properties-table-skeleton";
import { usePropertiesQuery } from "@/modules/properties/hooks/use-properties";
import { computePropertyMetrics } from "@/modules/properties/lib/property-metrics";
import {
  propertiesListFiltersToQuery,
  type PropertiesListFilters,
} from "@/modules/properties/schemas/list-filters";

type PropertiesPageContentProps = {
  filters: PropertiesListFilters;
};

function getPropertiesErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Unable to load properties. Check that the API is running.";
}

export function PropertiesPageContent({ filters }: PropertiesPageContentProps) {
  const listQuery = propertiesListFiltersToQuery(filters);
  const metricsQuery = { limit: 100 } as const;

  const {
    data: listData,
    isPending: isListPending,
    isError: isListError,
    error: listError,
    refetch: refetchList,
    isFetching: isListFetching,
  } = usePropertiesQuery(listQuery);

  const { data: metricsData, isPending: isMetricsPending } =
    usePropertiesQuery(metricsQuery);

  const isPending = isListPending || isMetricsPending;
  const isError = isListError;

  useEffect(() => {
    if (isListError) {
      toast.error(getPropertiesErrorMessage(listError));
    }
  }, [isListError, listError]);

  const metrics = computePropertyMetrics(metricsData?.items ?? []);
  const hasFilteredResults = (listData?.items.length ?? 0) > 0;
  const showEmptyState =
    !isPending && !isError && listData && listData.items.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Manage listings, photos, and property details for your brokerage."
        actions={
          <Button className="rounded-lg" render={<Link href="/properties/new" />}>
            <Plus className="size-4" />
            New property
          </Button>
        }
      />

      {!isPending && !isError && metricsData ? (
        <PropertiesMetrics metrics={metrics} />
      ) : null}

      <PropertiesStatusFilter filters={filters} />

      {isPending ? <PropertiesTableSkeleton /> : null}

      {isError ? (
        <ErrorState
          title="Couldn't load properties"
          description={getPropertiesErrorMessage(listError)}
          onRetry={() => void refetchList()}
          retrying={isListFetching}
        />
      ) : null}

      {showEmptyState ? (
        <EmptyState
          icon={Building}
          title={
            filters.status
              ? "No properties with this status"
              : "No properties yet"
          }
          description={
            filters.status
              ? "Try another status filter or create a new listing."
              : "Create your first listing to manage inventory, photos, and pricing in one place."
          }
          action={
            filters.status ? undefined : (
              <Button render={<Link href="/properties/new" />}>
                <Plus className="size-4" aria-hidden="true" />
                Add property
              </Button>
            )
          }
        />
      ) : null}

      {!isPending && !isError && hasFilteredResults && listData ? (
        <PropertiesList items={listData.items} />
      ) : null}
    </div>
  );
}
