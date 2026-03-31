"use client";

import { useEffect } from "react";
import { divIcon, type LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

type LocationPickerMapProps = {
  selected: { lat: number; lng: number } | null;
  onPick: (point: { lat: number; lng: number }) => void;
};

const DEFAULT_CENTER: LatLngExpression = [52.3676, 4.9041];

const markerIcon = divIcon({
  className: "",
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#111;border:3px solid #fff;box-shadow:0 0 0 2px #111;"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function ClickHandler({ onPick }: { onPick: (point: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click: (e) => {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

function RecenterOnSelection({ selected }: { selected: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selected) return;
    map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 13));
  }, [map, selected]);

  return null;
}

export function LocationPickerMap({ selected, onPick }: LocationPickerMapProps) {
  const center: LatLngExpression = selected
    ? [selected.lat, selected.lng]
    : DEFAULT_CENTER;

  return (
    <div className="h-72 w-full overflow-hidden border border-outline-variant/30">
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnSelection selected={selected} />
        <ClickHandler onPick={onPick} />
        {selected ? <Marker position={[selected.lat, selected.lng]} icon={markerIcon} /> : null}
      </MapContainer>
    </div>
  );
}
