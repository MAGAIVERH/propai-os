import { PageHeader } from "@/components/page-header";
import { PropertyForm } from "@/modules/properties/components/property-form";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New property"
        description="Create a listing with address, square footage, price, and status."
        back={{ label: "Properties", href: "/properties" }}
      />
      <PropertyForm mode="create" />
    </div>
  );
}
