import { MapPin } from "lucide-react";

import {
  canRenderInteractiveMap,
  getMapConfig,
} from "@/modules/properties/lib/map-config";

type PropertyMapProps = {
  latitude: number | null;
  longitude: number | null;
  addressLabel: string;
};

type MapFrameProps = {
  latitude: number;
  longitude: number;
  title: string;
  src: string;
};

function MapFrame({ latitude, longitude, title, src }: MapFrameProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <iframe
        title={title}
        src={src}
        className="h-80 w-full border-0 bg-muted"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        aria-label={`Mapa do imóvel em ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
      />
    </div>
  );
}

type AddressFallbackProps = {
  addressLabel: string;
  latitude?: number | null;
  longitude?: number | null;
  hint?: string;
};

function AddressFallback({
  addressLabel,
  latitude,
  longitude,
  hint,
}: AddressFallbackProps) {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <MapPin className="h-4 w-4" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground">Localização</p>
        <p className="text-sm leading-6 text-muted-foreground">{addressLabel}</p>
        {latitude !== null &&
        latitude !== undefined &&
        longitude !== null &&
        longitude !== undefined ? (
          <p className="font-mono text-xs text-muted-foreground">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        ) : null}
        {hint ? (
          <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

function buildMapEmbedSrc(
  config: ReturnType<typeof getMapConfig>,
  latitude: number,
  longitude: number,
): string | null {
  if (config.provider === "osm") {
    const delta = 0.02;
    const bbox = [
      longitude - delta,
      latitude - delta,
      longitude + delta,
      latitude + delta,
    ].join("%2C");

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  }

  if (config.provider === "mapbox" && config.mapboxToken) {
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s(${longitude},${latitude})/${longitude},${latitude},14,0/800x400@2x?access_token=${encodeURIComponent(config.mapboxToken)}`;
  }

  if (config.provider === "google" && config.googleMapsApiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(config.googleMapsApiKey)}&q=${latitude},${longitude}&zoom=14`;
  }

  return null;
}

export function PropertyMap({
  latitude,
  longitude,
  addressLabel,
}: PropertyMapProps) {
  const config = getMapConfig();
  const hasCoordinates = latitude !== null && longitude !== null;

  if (!hasCoordinates) {
    return (
      <AddressFallback
        addressLabel={addressLabel}
        hint="Adicione latitude e longitude na edição do imóvel para exibir o mapa."
      />
    );
  }

  if (!canRenderInteractiveMap(config, latitude, longitude)) {
    return (
      <AddressFallback
        addressLabel={addressLabel}
        latitude={latitude}
        longitude={longitude}
        hint="Defina NEXT_PUBLIC_MAP_PROVIDER (osm, mapbox ou google) e o token correspondente para ver o mapa interativo."
      />
    );
  }

  const embedSrc = buildMapEmbedSrc(config, latitude, longitude);

  if (!embedSrc) {
    return (
      <AddressFallback
        addressLabel={addressLabel}
        latitude={latitude}
        longitude={longitude}
      />
    );
  }

  if (config.provider === "mapbox") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={embedSrc}
          alt={`Mapa do imóvel: ${addressLabel}`}
          className="h-80 w-full object-cover"
        />
      </div>
    );
  }

  return (
    <MapFrame
      latitude={latitude}
      longitude={longitude}
      title={`Mapa — ${addressLabel}`}
      src={embedSrc}
    />
  );
}
