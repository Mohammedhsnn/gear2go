"use client";

import { useEffect } from "react";
import Link from "next/link";
import { divIcon, latLngBounds } from "leaflet";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { formatEUR } from "@/data/catalog";

type MapPoint = { lat: number; lng: number };

type MapItem = {
  id: string;
  title: string;
  ownerName: string;
  location: string;
  pricePerDayCents: number;
  point: MapPoint;
};

type HomeCategoryMapProps = {
  homePoint: MapPoint | null;
  homeAddress: string | null;
  mapItems: MapItem[];
  selectedItemId?: string | null;
  selectedRadiusKm?: number | "all";
  onSelectItem?: (itemId: string) => void;
  onClearSelection?: () => void;
};

const DEFAULT_CENTER: [number, number] = [52.3676, 4.9041];

const homeMarkerIcon = divIcon({
  className: "",
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#b91c1c;border:3px solid #fff;box-shadow:0 0 0 2px #b91c1c;"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function toShortEuro(cents: number) {
  const value = cents / 100;
  if (value >= 1000) {
    return `EUR ${Math.round(value / 100) / 10}k`;
  }
  return `EUR ${Math.round(value)}`;
}

function createPriceMarkerIcon(pricePerDayCents: number, active: boolean) {
  const background = active ? "#14532d" : "#166534";
  const outline = active ? "#14532d" : "#166534";
  return divIcon({
    className: "",
    html: `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:28px;padding:0 10px;border-radius:9999px;background:${background};color:#fff;font-weight:800;font-size:11px;letter-spacing:0.04em;border:2px solid #fff;box-shadow:0 0 0 2px ${outline};text-transform:uppercase;">${toShortEuro(pricePerDayCents)}</span>`,
    iconSize: [64, 28],
    iconAnchor: [32, 14],
  });
}

function ClearSelectionOnMapClick({ onClearSelection }: { onClearSelection?: () => void }) {
  useMapEvents({
    click: () => {
      onClearSelection?.();
    },
  });

  return null;
}

function FitMapToMarkers({
  homePoint,
  markers,
}: {
  homePoint: MapPoint | null;
  markers: MapPoint[];
}) {
  const map = useMap();

  useEffect(() => {
    const points = [...markers];
    if (homePoint) {
      points.push(homePoint);
    }

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], Math.max(map.getZoom(), 12));
      return;
    }

    const bounds = latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
  }, [homePoint, map, markers]);

  return null;
}

export function HomeCategoryMap({
  homePoint,
  homeAddress,
  mapItems,
  selectedItemId = null,
  selectedRadiusKm = "all",
  onSelectItem,
  onClearSelection,
}: HomeCategoryMapProps) {
  const mapCenter: [number, number] = homePoint
    ? [homePoint.lat, homePoint.lng]
    : DEFAULT_CENTER;

  return (
    <MapContainer center={mapCenter} zoom={11} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitMapToMarkers
        homePoint={homePoint}
        markers={mapItems.map((item) => ({ lat: item.point.lat, lng: item.point.lng }))}
      />
      <ClearSelectionOnMapClick onClearSelection={onClearSelection} />
      {homePoint ? (
        <Marker position={[homePoint.lat, homePoint.lng]} icon={homeMarkerIcon}>
          <Popup>
            <div>
              <p className="font-semibold">Jouw thuisadres</p>
              <p>{homeAddress ?? "Ingesteld"}</p>
            </div>
          </Popup>
        </Marker>
      ) : null}
      {homePoint && selectedRadiusKm !== "all" ? (
        <Circle
          center={[homePoint.lat, homePoint.lng]}
          radius={selectedRadiusKm * 1000}
          pathOptions={{ color: "#166534", weight: 2, fillOpacity: 0.07 }}
        />
      ) : null}
      {mapItems.map((item) => (
        <Marker
          key={`map-${item.id}`}
          position={[item.point.lat, item.point.lng]}
          icon={createPriceMarkerIcon(item.pricePerDayCents, selectedItemId === item.id)}
          eventHandlers={{
            click: () => {
              onSelectItem?.(item.id);
            },
          }}
        >
          <Popup>
            <div className="space-y-1 min-w-[180px]">
              <p className="font-semibold leading-tight">{item.title}</p>
              <p className="text-xs text-slate-600">{item.ownerName}</p>
              <p className="text-xs">{item.location}</p>
              <p className="text-sm font-bold">{formatEUR(item.pricePerDayCents)} / dag</p>
              <Link className="text-sm underline" href={`/products/${encodeURIComponent(item.id)}`}>
                Bekijk verhuurpost
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
