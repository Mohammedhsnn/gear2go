import { NextResponse } from "next/server";

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  addresstype?: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    country?: string;
    country_code?: string;
  };
};

const ALLOWED_CITY_TYPES = new Set(["city", "town", "municipality"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("format", "jsonv2");
  nominatimUrl.searchParams.set("addressdetails", "1");
  nominatimUrl.searchParams.set("countrycodes", "nl");
  nominatimUrl.searchParams.set("limit", "6");
  nominatimUrl.searchParams.set("q", q);

  const response = await fetch(nominatimUrl.toString(), {
    headers: {
      "User-Agent": "Gear2Go/1.0 (location-search)",
      "Accept-Language": "nl,en",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  const data = (await response.json().catch(() => [])) as NominatimResult[];
  const seen = new Set<string>();
  const suggestions = data
    .filter((item) => {
      const cc = item.address?.country_code?.toLowerCase();
      const type = (item.addresstype || item.type || "").toLowerCase();
      return cc === "nl" && ALLOWED_CITY_TYPES.has(type);
    })
    .map((item) => {
      const city =
        item.address?.city ||
        item.address?.town ||
        item.address?.municipality ||
        item.address?.village ||
        item.display_name.split(",")[0]?.trim() ||
        "Onbekende plaats";

      return {
        label: `${city}, Nederland`,
        lat: Number(item.lat),
        lng: Number(item.lon),
      };
    })
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
    .filter((item) => {
      const key = item.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return NextResponse.json({ suggestions });
}
