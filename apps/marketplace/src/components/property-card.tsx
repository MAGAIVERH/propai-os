import type { PropertyResponse } from "@propai/shared";
import Link from "next/link";

import { formatCityState, formatPrice, propertyTypeLabel } from "@/lib/format";

type CardProperty = Pick<
  PropertyResponse,
  | "id"
  | "title"
  | "type"
  | "city"
  | "state"
  | "zipCode"
  | "bedrooms"
  | "bathrooms"
  | "sqFt"
  | "priceUsdCents"
  | "rentOrSale"
>;

export function PropertyCard({
  property,
  imageUrl,
}: {
  property: CardProperty;
  imageUrl?: string | null;
}) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group rounded-card border-border bg-card hover:border-primary/60 flex flex-col overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={property.title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="from-muted to-card flex size-full items-center justify-center bg-gradient-to-br">
            <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              {propertyTypeLabel(property.type)}
            </span>
          </div>
        )}
        <span className="bg-background/85 absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur">
          {property.rentOrSale === "rent" ? "For Rent" : "For Sale"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-primary text-lg font-bold">
          {formatPrice(property.priceUsdCents, property.rentOrSale)}
        </p>
        <p className="group-hover:text-primary line-clamp-1 font-medium">{property.title}</p>
        <p className="text-muted-foreground text-sm">
          {formatCityState(property)} · {property.zipCode}
        </p>
        <div className="border-border text-muted-foreground mt-2 flex items-center gap-3 border-t pt-3 text-xs">
          <span>
            <span className="text-foreground font-semibold">{property.bedrooms}</span> bd
          </span>
          <span className="text-border">|</span>
          <span>
            <span className="text-foreground font-semibold">{property.bathrooms}</span> ba
          </span>
          {property.sqFt ? (
            <>
              <span className="text-border">|</span>
              <span>
                <span className="text-foreground font-semibold">
                  {property.sqFt.toLocaleString()}
                </span>{" "}
                sqft
              </span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
