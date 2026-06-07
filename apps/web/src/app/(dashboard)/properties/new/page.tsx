import { ModuleHeader } from "@/components/module-header";
import { PropertyForm } from "@/modules/properties/components/property-form";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Module"
        title="New property"
        description="Create a listing with address, square footage, price, and status."
      />
      <PropertyForm mode="create" />
    </div>
  );
}
