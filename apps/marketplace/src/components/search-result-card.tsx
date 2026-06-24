import type { SemanticSearchResultItem } from "@propai/shared";
import Link from "next/link";

import { formatCityState, formatPrice, propertyTypeLabel } from "@/lib/format";

export function SearchResultCard({ item }: { item: SemanticSearchResultItem }) {
  const matchPct = Math.round(item.relevanceScore * 100);

  return (
    <Link
      href={`/properties/${item.id}`}
      className="group rounded-card border-border bg-card hover:border-primary/60 flex flex-col overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30"
    >
      <div className="from-muted to-card relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br">
        <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          {propertyTypeLabel(item.type)}
        </span>
        <span
          className="bg-primary/15 text-primary absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold"
          title="Hybrid relevance score"
        >
          {matchPct}% match
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-primary text-lg font-bold">
          {formatPrice(item.priceUsdCents, item.rentOrSale)}
        </p>
        <p className="group-hover:text-primary line-clamp-1 font-medium">{item.title}</p>
        <p className="text-muted-foreground text-sm">
          {formatCityState(item)} · {item.zipCode}
        </p>
        <div className="border-border text-muted-foreground mt-2 flex items-center gap-3 border-t pt-3 text-xs">
          <span>
            <span className="text-foreground font-semibold">{item.bedrooms}</span> bd
          </span>
          <span className="text-border">|</span>
          <span>
            <span className="text-foreground font-semibold">{item.bathrooms}</span> ba
          </span>
          {item.sqFt ? (
            <>
              <span className="text-border">|</span>
              <span>
                <span className="text-foreground font-semibold">{item.sqFt.toLocaleString()}</span>{" "}
                sqft
              </span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
