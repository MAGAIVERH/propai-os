export type MapProvider = "mapbox" | "google" | "osm" | "none";

export type MapConfig = {
  provider: MapProvider;
  mapboxToken: string;
  googleMapsApiKey: string;
};

function normalizeProvider(value: string | undefined): MapProvider {
  const normalized = value?.trim().toLowerCase();

  if (
    normalized === "mapbox" ||
    normalized === "google" ||
    normalized === "osm"
  ) {
    return normalized;
  }

  return "none";
}

export function getMapConfig(): MapConfig {
  return {
    provider: normalizeProvider(process.env.NEXT_PUBLIC_MAP_PROVIDER),
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "",
  };
}

export function canRenderInteractiveMap(
  config: MapConfig,
  latitude: number | null,
  longitude: number | null,
): boolean {
  if (latitude === null || longitude === null) {
    return false;
  }

  if (config.provider === "osm") {
    return true;
  }

  if (config.provider === "mapbox") {
    return config.mapboxToken.length > 0;
  }

  if (config.provider === "google") {
    return config.googleMapsApiKey.length > 0;
  }

  return false;
}
