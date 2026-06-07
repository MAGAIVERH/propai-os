import { PropertiesCards } from "@/modules/properties/components/properties-cards";
import { PropertiesTable } from "@/modules/properties/components/properties-table";
import type { PropertyListItem } from "@/modules/properties/types/property";

type PropertiesListProps = {
  items: PropertyListItem[];
};

export function PropertiesList({ items }: PropertiesListProps) {
  return (
    <>
      <div className="hidden md:block">
        <PropertiesTable items={items} />
      </div>
      <div className="md:hidden">
        <PropertiesCards items={items} />
      </div>
    </>
  );
}
