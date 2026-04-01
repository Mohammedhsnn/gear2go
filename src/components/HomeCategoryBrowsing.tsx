"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { divIcon, latLngBounds, type LatLngExpression } from "leaflet";
import { useSearchParams } from "next/navigation";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { ProductCard, type ProductCardModel } from "@/components/ProductCard";
import { categories, formatEUR, type CategoryId } from "@/data/catalog";

type HomeCategoryBrowsingProps = {
  homeLocation?: {
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
};

type ApiItem = {
  id: string;
  title: string;
  subtitle: string | null;
  location: string | null;
  pricePerDayCents: number;
  imageUrl: string | null;
  category: { slug: string; label: string } | null;
  owner: { displayName: string | null } | null;
};

type BrowseItem = ProductCardModel & {
  categorySlug: string;
  ownerName: string;
  point: { lat: number; lng: number } | null;
};

const DEFAULT_CENTER: LatLngExpression = [52.3676, 4.9041];
const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;

const ICONS: Record<CategoryId, string> = {
  watersporten: "kayaking",
  wintersport: "downhill_skiing",
  fietssporten: "pedal_bike",
  balsporten: "sports_soccer",
  overige_sporten: "deployed_code",
  transport_baggage: "luggage",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80";

const itemMarkerIcon = divIcon({
  className: "",
  html: '<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#166534;border:2px solid #fff;box-shadow:0 0 0 2px #166534;"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const homeMarkerIcon = divIcon({
  className: "",
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#b91c1c;border:3px solid #fff;box-shadow:0 0 0 2px #b91c1c;"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function parsePointFromLocation(location?: string | null): { lat: number; lng: number } | null {
  if (!location) return null;
  const match = location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function FitMapToMarkers({
  homePoint,
  markers,
}: {
  homePoint: { lat: number; lng: number } | null;
  markers: Array<{ lat: number; lng: number }>;
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

export function HomeCategoryBrowsing({ homeLocation = null }: HomeCategoryBrowsingProps) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<"all" | CategoryId>("all");
  const [sortBy, setSortBy] = useState<"priceAsc" | "none">("priceAsc");
  const [radiusKm, setRadiusKm] = useState<number | "all">(25);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BrowseItem[]>([]);
  const q = (searchParams.get("q") ?? "").trim();
  const geocodeCacheRef = useRef(new Map<string, { lat: number; lng: number } | null>());

  const homePoint = useMemo(
    () =>
      Number.isFinite(homeLocation?.lat) && Number.isFinite(homeLocation?.lng)
        ? { lat: Number(homeLocation?.lat), lng: Number(homeLocation?.lng) }
        : null,
    [homeLocation?.lat, homeLocation?.lng],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      try {
        const queryPart = q ? `?q=${encodeURIComponent(q)}` : "";
        const res = await fetch(`/api/items${queryPart}`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as { items?: ApiItem[] } | null;

        if (!cancelled && res.ok) {
          const mapped: BrowseItem[] = (data?.items ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl?.trim() || fallbackImage,
            pricePerDayCents: item.pricePerDayCents,
            location: item.location?.trim() || "Nederland",
            tags: [item.subtitle?.trim() || item.category?.label || "Gear", item.owner?.displayName?.trim() || "Verhuurder"],
            categorySlug: item.category?.slug || "",
            ownerName: item.owner?.displayName?.trim() || "Verhuurder",
            point: parsePointFromLocation(item.location),
          }));
          setItems(mapped);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadItems();
    return () => {
      cancelled = true;
    };
  }, [q]);

  useEffect(() => {
    let cancelled = false;

    async function geocodeUnknownLocations() {
      const unresolved = items.filter(
        (item) =>
          !item.point &&
          item.location &&
          item.location.length >= 2 &&
          !geocodeCacheRef.current.has(item.location),
      );
      if (unresolved.length === 0) return;

      const uniqueLocations = [...new Set(unresolved.map((item) => item.location))].slice(0, 16);
      const resolvedByLocation = new Map<string, { lat: number; lng: number } | null>();

      for (const location of uniqueLocations) {
        try {
          const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(location)}`, {
            cache: "no-store",
          });
          const data = (await res.json().catch(() => ({}))) as {
            suggestions?: Array<{ lat: number; lng: number }>;
          };
          const first = data.suggestions?.[0];
          resolvedByLocation.set(
            location,
            first && Number.isFinite(first.lat) && Number.isFinite(first.lng)
              ? { lat: first.lat, lng: first.lng }
              : null,
          );
        } catch {
          resolvedByLocation.set(location, null);
        }
      }

      if (cancelled) return;

      for (const [location, point] of resolvedByLocation.entries()) {
        geocodeCacheRef.current.set(location, point);
      }

      const resolvedPoints = [...resolvedByLocation.values()].filter(
        (point): point is { lat: number; lng: number } => Boolean(point),
      );
      if (resolvedPoints.length === 0) return;

      setItems((prev) =>
        prev.map((item) => {
          if (item.point) return item;
          const resolved = resolvedByLocation.get(item.location);
          if (!resolved) return item;
          return { ...item, point: resolved };
        }),
      );
    }

    void geocodeUnknownLocations();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    const query = normalize(q);

    let scoped = items.filter((item) => {
      if (selectedCategory !== "all" && item.categorySlug !== selectedCategory) return false;
      if (!query) return true;
      const haystack = normalize(`${item.title} ${item.location} ${(item.tags ?? []).join(" ")}`);
      return haystack.includes(query);
    });

    if (homePoint && radiusKm !== "all") {
      scoped = scoped.filter((item) => item.point && distanceKm(homePoint, item.point) <= radiusKm);
    }

    if (sortBy === "priceAsc") {
      return [...scoped].sort((a, b) => a.pricePerDayCents - b.pricePerDayCents);
    }

    return scoped;
  }, [homePoint, items, q, radiusKm, selectedCategory, sortBy]);

  const mapItems = filteredAndSorted.filter((item) => item.point);
  const mapCenter: LatLngExpression = homePoint ? [homePoint.lat, homePoint.lng] : DEFAULT_CENTER;

  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-surface">
      <div className="mb-10">
        <h2 className="font-headline font-black text-4xl md:text-6xl uppercase tracking-tighter text-primary">
          Ontdek Gear
        </h2>
        <p className="font-body text-on-surface-variant mt-2 max-w-2xl">
          Hier zie je alle beschikbare items, inclusief gear die door andere gebruikers is geplaatst.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-12">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`p-4 border transition-all text-left ${
            selectedCategory === "all"
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined block mb-2">apps</span>
          <span className="text-[11px] md:text-xs uppercase tracking-widest font-bold">Alles</span>
        </button>

        {categories.map((category) => {
          const active = category.id === selectedCategory;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 border transition-all text-left ${
                active
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined block mb-2" aria-hidden="true">
                {ICONS[category.id]}
              </span>
              <span className="text-[11px] md:text-xs uppercase tracking-widest font-bold">{category.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end mb-6">
        <div className="flex flex-wrap justify-end gap-4">
          <label className="flex items-center gap-3 text-xs uppercase tracking-widest font-bold text-on-surface-variant">
            Sorteer
            <select
              className="bg-surface-container-low border border-outline-variant/30 px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "priceAsc" | "none")}
            >
              <option value="priceAsc">Prijs: laag naar hoog</option>
              <option value="none">Standaard</option>
            </select>
          </label>

          <label className="flex items-center gap-3 text-xs uppercase tracking-widest font-bold text-on-surface-variant">
            Afstand
            <select
              className="bg-surface-container-low border border-outline-variant/30 px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface"
              value={radiusKm}
              onChange={(e) => {
                const value = e.target.value;
                setRadiusKm(value === "all" ? "all" : Number(value));
              }}
              disabled={!homePoint}
            >
              {RADIUS_OPTIONS.map((radius) => (
                <option key={radius} value={radius}>
                  Binnen {radius} km
                </option>
              ))}
              <option value="all">Alle afstanden</option>
            </select>
          </label>
        </div>
      </div>

      {!homePoint ? (
        <p className="mb-6 text-xs text-on-surface-variant">
          Voeg een thuisadres toe aan je account voor afstandsfilters rond jouw locatie.
        </p>
      ) : null}

      <div className="mb-10 border border-outline-variant/30 overflow-hidden bg-surface-container-low">
        <div className="h-[420px] w-full">
          <MapContainer center={mapCenter} zoom={11} className="h-full w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitMapToMarkers
              homePoint={homePoint}
              markers={mapItems.map((item) => ({ lat: item.point!.lat, lng: item.point!.lng }))}
            />
            {homePoint ? (
              <Marker position={[homePoint.lat, homePoint.lng]} icon={homeMarkerIcon}>
                <Popup>
                  <div>
                    <p className="font-semibold">Jouw thuisadres</p>
                    <p>{homeLocation?.address ?? "Ingesteld"}</p>
                  </div>
                </Popup>
              </Marker>
            ) : null}
            {mapItems.map((item) => (
              <Marker key={`map-${item.id}`} position={[item.point!.lat, item.point!.lng]} icon={itemMarkerIcon}>
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
        </div>
      </div>

      {loading ? (
        <div className="bg-surface-container-low p-8 mb-6">
          <p className="uppercase text-xs tracking-widest text-on-surface-variant">Items laden...</p>
        </div>
      ) : null}

      {filteredAndSorted.length === 0 ? (
        <div className="bg-surface-container-low p-8">
          <p className="uppercase text-xs tracking-widest text-on-surface-variant">
            Geen items beschikbaar in deze categorie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAndSorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
