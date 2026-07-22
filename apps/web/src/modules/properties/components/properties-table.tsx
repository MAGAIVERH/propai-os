import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyStatusBadge } from "@/modules/properties/components/property-status-badge";
import { PropertyThumb } from "@/modules/properties/components/property-thumb";
import type { PropertyListItem } from "@/modules/properties/types/property";

type PropertiesTableProps = {
  items: PropertyListItem[];
};

export function PropertiesTable({ items }: PropertiesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted hover:bg-muted">
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Property
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Address
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Price
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {items.map((property) => (
            <TableRow key={property.id} className="border-border">
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <PropertyThumb propertyId={property.id} className="size-12" />
                  <div className="min-w-0">
                    <Link
                      href={`/properties/${property.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {property.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {property.typeLabel} · {property.rentOrSaleLabel}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 text-muted-foreground">
                {property.addressLine1}
              </TableCell>
              <TableCell className="px-6 py-4 text-muted-foreground">
                {property.city}, {property.state}
              </TableCell>
              <TableCell className="px-6 py-4 font-medium text-foreground">
                {property.priceDisplay}
              </TableCell>
              <TableCell className="px-6 py-4">
                <PropertyStatusBadge
                  status={property.status}
                  label={property.statusLabel}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
