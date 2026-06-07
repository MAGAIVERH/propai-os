import { notFound } from "next/navigation";

import { ModuleHeader } from "@/components/module-header";
import { ApiClientError } from "@/lib/api-client";
import { PropertyForm } from "@/modules/properties/components/property-form";
import { getPropertyById } from "@/modules/properties/queries/get-property-by-id";
import { mapPropertyToFormValues } from "@/modules/properties/schemas/update-property";

type EditPropertyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const { id } = await params;

  try {
    const property = await getPropertyById(id);

    return (
      <div className="space-y-6">
        <ModuleHeader
          label="Module"
          title="Edit property"
          description="Update address, square footage, price, and status."
        />
        <PropertyForm
          mode="edit"
          propertyId={property.id}
          defaultValues={mapPropertyToFormValues(property)}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
