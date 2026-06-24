import type { PropertyType, RentOrSale } from "@propai/shared";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  single_family: "Single Family",
  condo: "Condo",
  townhouse: "Townhouse",
  multi_family: "Multi-Family",
};

export function propertyTypeLabel(type: string): string {
  return PROPERTY_TYPE_LABELS[type as PropertyType] ?? type;
}

export function formatPrice(cents: number, rentOrSale: RentOrSale | string): string {
  const dollars = cents / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
  return rentOrSale === "rent" ? `${formatted}/mo` : formatted;
}

export function formatAddress(p: {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
}): string {
  return [p.addressLine1, p.addressLine2, `${p.city}, ${p.state} ${p.zipCode}`]
    .filter(Boolean)
    .join(", ");
}

export function formatCityState(p: { city: string; state: string }): string {
  return `${p.city}, ${p.state}`;
}

export function featureLabel(key: string): string {
  return key
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
