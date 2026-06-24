"use client";

import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  priceLabel: string;
};

type LeafletMapProps = {
  points: MapPoint[];
  cluster?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
  /** Fallback center (US) when no points have coordinates. */
  fallbackCenter?: [number, number];
  fallbackZoom?: number;
};

// Continental-US center.
const US_CENTER: [number, number] = [39.5, -98.35];

function markerHtml(selected: boolean): string {
  const ring = selected ? "box-shadow:0 0 0 4px rgba(52,211,153,.4);" : "";
  return `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#34d399;border:2px solid #0b1220;${ring}"></span>`;
}

export function LeafletMap({
  points,
  cluster = false,
  selectedId,
  onSelect,
  className,
  fallbackCenter = US_CENTER,
  fallbackZoom = 4,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  // Initialise the map once, then (re)draw markers when points change.
  // `onSelect` is expected to be a stable callback (e.g. a useState setter).
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      if (cluster) {
        await import("leaflet.markercluster");
      }
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          scrollWheelZoom: false,
        }).setView(fallbackCenter, fallbackZoom);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;
      markersRef.current.clear();

      const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer: any = cluster
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (L as any).markerClusterGroup({ showCoverageOnHover: false })
        : L.layerGroup();

      for (const p of valid) {
        const marker = L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: "",
            html: markerHtml(p.id === selectedId),
            iconSize: [14, 14],
          }),
        });
        marker.bindPopup(`<strong>${p.priceLabel}</strong><br/>${escapeHtml(p.title)}`);
        marker.on("click", () => onSelect?.(p.id));
        layer.addLayer(marker);
        markersRef.current.set(p.id, marker);
      }

      layer.addTo(map);

      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      // Cleanup this layer on re-run.
      return () => {
        map.removeLayer(layer);
      };
    }

    const cleanupPromise = init();

    return () => {
      cancelled = true;
      void cleanupPromise.then((fn) => fn?.());
    };
  }, [points, cluster, selectedId, onSelect, fallbackCenter, fallbackZoom]);

  // Tear down the map on unmount.
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
