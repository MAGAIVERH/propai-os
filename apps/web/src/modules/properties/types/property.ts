import type {
  PropertyListResponse,
  PropertyResponse,
  PropertyStatus,
  PropertyType,
  RentOrSale,
} from "@propai/shared";

export type PropertyListItem = {
  id: string;
  title: string;
  addressLine1: string;
  city: string;
  state: string;
  type: PropertyType;
  typeLabel: string;
  status: PropertyStatus;
  statusLabel: string;
  rentOrSale: RentOrSale;
  rentOrSaleLabel: string;
  priceUsdCents: number;
  priceDisplay: string;
  bedrooms: number;
  bathrooms: string;
  sqFt: number;
  createdAt: string;
};

export type PropertiesListResult = {
  items: PropertyListItem[];
  nextCursor: string | null;
};

export type { PropertyListResponse, PropertyResponse };
