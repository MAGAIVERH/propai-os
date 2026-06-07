import { PropertiesPageContent } from "@/modules/properties/components/properties-page-content";
import { parsePropertiesListFilters } from "@/modules/properties/schemas/list-filters";

type PropertiesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const params = await searchParams;
  const filters = parsePropertiesListFilters(params);

  return <PropertiesPageContent filters={filters} />;
}
