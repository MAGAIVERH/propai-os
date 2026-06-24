"use client";

import type { PropertyResponse } from "@propai/shared";
import Link from "next/link";
import { useMemo, useState } from "react";

import { LeafletMap, type MapPoint } from "@/components/leaflet-map";
import { formatCityState, formatPrice, propertyTypeLabel } from "@/lib/format";

export function MapExplorer({ properties }: { properties: PropertyResponse[] }) {
  const geoProperties = useMemo(
    () => properties.filter((p) => p.latitude !== null && p.longitude !== null),
    [properties],
  );

  const [selectedId, setSelectedId] = useState<string | null>(geoProperties[0]?.id ?? null);

  const points: MapPoint[] = useMemo(
    () =>
      geoProperties.map((p) => ({
        id: p.id,
        lat: Number(p.latitude),
        lng: Number(p.longitude),
        title: p.title,
        priceLabel: formatPrice(p.priceUsdCents, p.rentOrSale),
      })),
    [geoProperties],
  );

  const selected = geoProperties.find((p) => p.id === selectedId) ?? null;

  if (geoProperties.length === 0) {
    return (
      <div className="rounded-card border-border bg-card/40 border border-dashed px-6 py-16 text-center">
        <p className="font-medium">No mappable listings</p>
        <p className="text-muted-foreground mt-1 text-sm">
          None of the current listings have map coordinates. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="relative order-2 lg:order-1">
        <LeafletMap
          points={points}
          cluster
          selectedId={selectedId}
          onSelect={setSelectedId}
          className="rounded-card border-border h-[420px] w-full overflow-hidden border lg:h-[640px]"
        />

        {selected && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 lg:inset-x-auto lg:right-3 lg:w-72">
            <Link
              href={`/properties/${selected.id}`}
              className="rounded-card border-border bg-card/95 hover:border-primary/60 pointer-events-auto block border p-4 shadow-xl backdrop-blur transition-colors"
            >
              <p className="text-primary text-base font-bold">
                {formatPrice(selected.priceUsdCents, selected.rentOrSale)}
              </p>
              <p className="line-clamp-1 text-sm font-medium">{selected.title}</p>
              <p className="text-muted-foreground text-xs">
                {formatCityState(selected)} · {selected.bedrooms} bd · {selected.bathrooms} ba
              </p>
            </Link>
          </div>
        )}
      </div>

      <ul className="order-1 flex max-h-[640px] flex-col gap-2 overflow-y-auto lg:order-2">
        {geoProperties.map((p) => {
          const isSelected = p.id === selectedId;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-primary font-semibold">
                    {formatPrice(p.priceUsdCents, p.rentOrSale)}
                  </p>
                  <span className="text-muted-foreground text-xs">{propertyTypeLabel(p.type)}</span>
                </div>
                <p className="line-clamp-1 text-sm font-medium">{p.title}</p>
                <p className="text-muted-foreground text-xs">
                  {formatCityState(p)} · {p.bedrooms} bd · {p.bathrooms} ba
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
