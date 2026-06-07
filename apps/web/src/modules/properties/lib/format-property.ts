import type {
  PropertyResponse,
  PropertyStatus,
  PropertyType,
  RentOrSale,
} from "@propai/shared";

import type { PropertyListItem } from "@/modules/properties/types/property";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  single_family: "Single family",
  condo: "Condo",
  townhouse: "Townhouse",
  multi_family: "Multi-family",
};

const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: "Draft",
  active: "Active",
  under_contract: "Under contract",
  sold: "Sold",
  rented: "Rented",
};

const RENT_OR_SALE_LABELS: Record<RentOrSale, string> = {
  sale: "For sale",
  rent: "For rent",
};

export function formatPriceUsdCents(cents: number): string {
  return usdFormatter.format(cents / 100);
}

export function getPropertyTypeLabel(type: PropertyType): string {
  return PROPERTY_TYPE_LABELS[type];
}

export function getPropertyStatusLabel(status: PropertyStatus): string {
  return PROPERTY_STATUS_LABELS[status];
}

export function getRentOrSaleLabel(rentOrSale: RentOrSale): string {
  return RENT_OR_SALE_LABELS[rentOrSale];
}

export function mapPropertyToListItem(property: PropertyResponse): PropertyListItem {
  return {
    id: property.id,
    title: property.title,
    addressLine1: property.addressLine1,
    city: property.city,
    state: property.state,
    type: property.type,
    typeLabel: getPropertyTypeLabel(property.type),
    status: property.status,
    statusLabel: getPropertyStatusLabel(property.status),
    rentOrSale: property.rentOrSale,
    rentOrSaleLabel: getRentOrSaleLabel(property.rentOrSale),
    priceUsdCents: property.priceUsdCents,
    priceDisplay: formatPriceUsdCents(property.priceUsdCents),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqFt: property.sqFt,
    createdAt: property.createdAt,
  };
}
