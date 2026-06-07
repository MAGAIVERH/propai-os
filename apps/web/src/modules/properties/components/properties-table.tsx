import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PropertyListItem } from "@/modules/properties/types/property";
import type { PropertyStatus } from "@propai/shared";

type PropertiesTableProps = {
  items: PropertyListItem[];
};

function getStatusBadgeVariant(
  status: PropertyStatus,
): "default" | "secondary" | "outline" {
  if (status === "active") {
    return "default";
  }

  if (status === "draft") {
    return "secondary";
  }

  return "outline";
}

export function PropertiesTable({ items }: PropertiesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted hover:bg-muted">
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Imóvel
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Localização
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tipo
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preço
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
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{property.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {property.rentOrSaleLabel} · {property.bedrooms} quartos ·{" "}
                    {property.bathrooms} banh. · {property.sqFt.toLocaleString("en-US")} sq ft
                  </p>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 text-muted-foreground">
                {property.city}, {property.state}
              </TableCell>
              <TableCell className="px-6 py-4 text-muted-foreground">
                {property.typeLabel}
              </TableCell>
              <TableCell className="px-6 py-4 font-medium text-foreground">
                {property.priceDisplay}
              </TableCell>
              <TableCell className="px-6 py-4">
                <Badge variant={getStatusBadgeVariant(property.status)}>
                  {property.statusLabel}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
