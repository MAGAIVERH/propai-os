import { ModuleHeader } from "@/components/module-header";
import { PropertyForm } from "@/modules/properties/components/property-form";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Módulo"
        title="Novo imóvel"
        description="Cadastre um anúncio com endereço, metragem, preço e status."
      />
      <PropertyForm mode="create" />
    </div>
  );
}
