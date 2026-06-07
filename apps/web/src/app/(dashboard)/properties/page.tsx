import { Building } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ModuleHeader } from "@/components/module-header";

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Module"
        title="Properties"
        description="Manage listings, photos, and property details for your brokerage."
      />
      <EmptyState
        icon={Building}
        title="No properties yet"
        description="Create your first listing to start managing inventory, photos, and pricing from one place."
      />
    </div>
  );
}
