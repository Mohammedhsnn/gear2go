type NominatimResult = {
  lat?: string;
  lon?: string;
};

export function parsePointFromCoordinateString(input: string): { lat: number; lng: number } | null {
  const match = input.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

export async function resolveAddressToPoint(address: string): Promise<{ lat: number; lng: number } | null> {
  const directPoint = parsePointFromCoordinateString(address);
  if (directPoint) return directPoint;

  const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
  geocodeUrl.searchParams.set("format", "jsonv2");
  geocodeUrl.searchParams.set("addressdetails", "1");
  geocodeUrl.searchParams.set("countrycodes", "nl");
  geocodeUrl.searchParams.set("limit", "1");
  geocodeUrl.searchParams.set("q", address);

  const response = await fetch(geocodeUrl.toString(), {
    headers: {
      "User-Agent": "Gear2Go/1.0 (location-validate)",
      "Accept-Language": "nl,en",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json().catch(() => [])) as NominatimResult[];
  const first = data[0];
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}
