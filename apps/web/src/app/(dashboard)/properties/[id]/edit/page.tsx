import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ApiClientError } from "@/lib/api-client";
import { PropertyEditForm } from "@/modules/properties/components/property-edit-form";
import { getPropertyById } from "@/modules/properties/queries/get-property-by-id";
import { mapPropertyToFormValues } from "@/modules/properties/schemas/update-property";

type EditPropertyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const { id } = await params;

  let property: Awaited<ReturnType<typeof getPropertyById>>;

  try {
    property = await getPropertyById(id);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit property"
        description="Update address, square footage, price, and status."
        back={{ label: "Property", href: `/properties/${property.id}` }}
      />
      <PropertyEditForm
        propertyId={property.id}
        defaultValues={mapPropertyToFormValues(property)}
      />
    </div>
  );
}
