import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth.js";

export const propertyTypeEnum = pgEnum("property_type", [
  "single_family",
  "condo",
  "townhouse",
  "multi_family",
]);

export const propertyStatusEnum = pgEnum("property_status", [
  "draft",
  "active",
  "under_contract",
  "sold",
  "rented",
]);

export const rentOrSaleEnum = pgEnum("rent_or_sale", ["sale", "rent"]);

/** US real estate listing (Day 16). Tenant-scoped via RLS on tenant_id. */
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    type: propertyTypeEnum("type").notNull(),
    status: propertyStatusEnum("status").notNull().default("draft"),
    priceUsdCents: integer("price_usd_cents").notNull(),
    rentOrSale: rentOrSaleEnum("rent_or_sale").notNull(),
    bedrooms: integer("bedrooms").notNull(),
    bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }).notNull(),
    sqFt: integer("sq_ft").notNull(),
    yearBuilt: integer("year_built"),
    hoaFeeUsd: integer("hoa_fee_usd"),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zipCode: text("zip_code").notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    softDeletedAt: timestamp("soft_deleted_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    index("properties_tenant_status_idx").on(table.tenantId, table.status),
    index("properties_tenant_city_state_idx").on(
      table.tenantId,
      table.city,
      table.state,
    ),
    index("properties_geo_idx").on(table.latitude, table.longitude),
  ],
);

/** Key-value features per listing (e.g. pool, garage). One key per property in v1. */
export const propertyFeatures = pgTable(
  "property_features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    featureKey: text("feature_key").notNull(),
    featureValue: text("feature_value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("property_features_property_id_idx").on(table.propertyId),
    uniqueIndex("property_features_property_key_uidx").on(
      table.propertyId,
      table.featureKey,
    ),
  ],
);

/** Ordered photos per listing; storage_key points to R2/S3 object (Day 19+). */
export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("property_images_property_id_sort_idx").on(
      table.propertyId,
      table.sortOrder,
    ),
  ],
);
