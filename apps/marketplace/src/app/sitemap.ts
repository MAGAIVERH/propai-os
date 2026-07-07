import type { MetadataRoute } from "next";

import { fetchPublicProperties } from "@/lib/api";
import { getDefaultTenantId } from "@/lib/env";

const SITE_URL = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "http://localhost:3001";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/properties", priority: 0.9, changeFrequency: "daily" },
  { path: "/search", priority: 0.8, changeFrequency: "weekly" },
  { path: "/properties/map", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const tenantId = getDefaultTenantId();
  let propertyEntries: MetadataRoute.Sitemap = [];

  if (tenantId) {
    try {
      const result = await fetchPublicProperties(tenantId, { limit: "50" });
      propertyEntries = result.properties.map((property) => ({
        url: `${SITE_URL}/properties/${property.id}`,
        lastModified: property.updatedAt ? new Date(property.updatedAt) : now,
        changeFrequency: "daily",
        priority: 0.8,
      }));
    } catch {
      // Sitemap should still build if the API is unavailable.
    }
  }

  return [...staticEntries, ...propertyEntries];
}
