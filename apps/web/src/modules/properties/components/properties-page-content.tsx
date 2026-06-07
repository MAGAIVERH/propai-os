"use client";

import { Building } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ModuleHeader } from "@/components/module-header";
import { ApiClientError } from "@/lib/api-client";
import { PropertiesTable } from "@/modules/properties/components/properties-table";
import { PropertiesTableSkeleton } from "@/modules/properties/components/properties-table-skeleton";
import { usePropertiesQuery } from "@/modules/properties/hooks/use-properties";

function getPropertiesErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Não foi possível carregar os imóveis. Verifique se a API está em execução.";
}

export function PropertiesPageContent() {
  const { data, isPending, isError, error } = usePropertiesQuery();

  useEffect(() => {
    if (isError) {
      toast.error(getPropertiesErrorMessage(error));
    }
  }, [isError, error]);

  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Módulo"
        title="Imóveis"
        description="Gerencie anúncios, fotos e detalhes dos imóveis da sua imobiliária."
      />

      {isPending ? <PropertiesTableSkeleton /> : null}

      {!isPending && !isError && data && data.items.length === 0 ? (
        <EmptyState
          icon={Building}
          title="Nenhum imóvel cadastrado"
          description="Crie seu primeiro anúncio para começar a gerenciar inventário, fotos e preços em um só lugar."
        />
      ) : null}

      {!isPending && !isError && data && data.items.length > 0 ? (
        <PropertiesTable items={data.items} />
      ) : null}
    </div>
  );
}
