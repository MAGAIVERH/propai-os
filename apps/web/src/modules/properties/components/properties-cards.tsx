import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PropertyStatusBadge } from "@/modules/properties/components/property-status-badge";
import type { PropertyListItem } from "@/modules/properties/types/property";

type PropertiesCardsProps = {
  items: PropertyListItem[];
};

export function PropertiesCards({ items }: PropertiesCardsProps) {
  return (
    <div className="grid gap-4">
      {items.map((property) => (
        <Card
          key={property.id}
          className="rounded-2xl border border-border bg-card ring-0"
        >
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>
                  <Link
                    href={`/properties/${property.id}`}
                    className="text-foreground hover:text-primary"
                  >
                    {property.title}
                  </Link>
                </CardTitle>
                <CardDescription>{property.addressLine1}</CardDescription>
              </div>
              <PropertyStatusBadge
                status={property.status}
                label={property.statusLabel}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.state}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {property.priceDisplay}
            </p>
            <p className="text-xs text-muted-foreground">
              {property.typeLabel} · {property.rentOrSaleLabel} ·{" "}
              {property.bedrooms} bed · {property.bathrooms} bath
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
