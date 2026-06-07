"use client";

import { Building, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ModuleHeader } from "@/components/module-header";
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

  return "Não foi possível carregar os imóveis. Verifique se a API está em execução.";
}

export function PropertiesPageContent({ filters }: PropertiesPageContentProps) {
  const listQuery = propertiesListFiltersToQuery(filters);
  const metricsQuery = { limit: 100 } as const;

  const {
    data: listData,
    isPending: isListPending,
    isError: isListError,
    error: listError,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <ModuleHeader
          label="Módulo"
          title="Imóveis"
          description="Gerencie anúncios, fotos e detalhes dos imóveis da sua imobiliária."
        />
        <Button
          className="shrink-0 rounded-xl"
          render={<Link href="/properties/new" />}
        >
          <Plus className="size-4" />
          Novo imóvel
        </Button>
      </div>

      {!isPending && !isError && metricsData ? (
        <PropertiesMetrics metrics={metrics} />
      ) : null}

      <PropertiesStatusFilter filters={filters} />

      {isPending ? <PropertiesTableSkeleton /> : null}

      {showEmptyState ? (
        <EmptyState
          icon={Building}
          title={
            filters.status
              ? "Nenhum imóvel com este status"
              : "Nenhum imóvel cadastrado"
          }
          description={
            filters.status
              ? "Tente outro filtro de status ou cadastre um novo anúncio."
              : "Crie seu primeiro anúncio para começar a gerenciar inventário, fotos e preços em um só lugar."
          }
        />
      ) : null}

      {!isPending && !isError && hasFilteredResults && listData ? (
        <PropertiesList items={listData.items} />
      ) : null}
    </div>
  );
}
