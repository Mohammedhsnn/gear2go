"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import { formatEUR } from "@/data/catalog";

type FavoriteItem = {
  id: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    imageUrl: string | null;
    location: string | null;
    pricePerDayCents: number;
    owner: {
      id: string;
      displayName: string | null;
      email: string;
    };
  };
};

type SortMode = "newest" | "priceAsc" | "priceDesc";

const fallbackImage =
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80";

export default function FavorietenPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  async function loadFavorites() {
    const res = await fetch("/api/favorites", { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/dashboard";
      return;
    }

    const data = (await res.json().catch(() => ({}))) as {
      favorites?: FavoriteItem[];
    };

    setItems(data.favorites ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadFavorites().catch(() => setLoading(false));
  }, []);

  async function removeFavorite(itemId: string) {
    setBusyItemId(itemId);

    await fetch("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });

    setItems((prev) => prev.filter((fav) => fav.item.id !== itemId));
    setBusyItemId(null);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const scoped = needle
      ? items.filter((fav) => {
          const ownerName = fav.item.owner.displayName || fav.item.owner.email;
          return (
            fav.item.title.toLowerCase().includes(needle) ||
            ownerName.toLowerCase().includes(needle) ||
            (fav.item.location || "").toLowerCase().includes(needle)
          );
        })
      : items;

    if (sortMode === "priceAsc") {
      return [...scoped].sort((a, b) => a.item.pricePerDayCents - b.item.pricePerDayCents);
    }

    if (sortMode === "priceDesc") {
      return [...scoped].sort((a, b) => b.item.pricePerDayCents - a.item.pricePerDayCents);
    }

    return [...scoped].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [items, q, sortMode]);

  return (
    <div className="min-h-dvh bg-surface text-on-surface px-6 md:px-12 py-24 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 md:mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant mb-3">Mijn account</p>
          <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter text-primary">
            Favorieten
          </h1>
          <p className="mt-3 text-on-surface-variant">
            Overzicht van opgeslagen verhuurposts. Start direct een chat met de verhuurder of ga naar de post.
          </p>
        </div>

        <div className="mb-6 grid md:grid-cols-[1fr_auto] gap-4">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op item, verhuurder of locatie"
            className="w-full bg-surface-container-high border border-outline-variant/30 px-4 py-3 text-sm"
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="bg-surface-container-high border border-outline-variant/30 px-4 py-3 text-sm uppercase tracking-wider font-bold"
          >
            <option value="newest">Nieuw toegevoegd</option>
            <option value="priceAsc">Prijs laag-hoog</option>
            <option value="priceDesc">Prijs hoog-laag</option>
          </select>
        </div>

        {loading ? (
          <div className="bg-surface-container-low p-8 border border-outline-variant/20">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant">Favorieten laden...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-low p-8 border border-outline-variant/20">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant">Nog geen favorieten gevonden.</p>
            <Link href="/ontdekken" className="inline-block mt-4 underline text-primary">
              Naar ontdekken
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((fav) => {
              const ownerName = fav.item.owner.displayName || fav.item.owner.email;
              const chatHref = `/berichten?owner=${encodeURIComponent(ownerName)}&product=${encodeURIComponent(fav.item.title)}&itemId=${encodeURIComponent(fav.item.id)}`;

              return (
                <article key={fav.id} className="bg-surface-container-low border border-outline-variant/20 overflow-hidden">
                  <Link href={`/products/${encodeURIComponent(fav.item.id)}`}>
                    <div className="aspect-[4/3] bg-surface-container-high overflow-hidden">
                      <img
                        src={fav.item.imageUrl || fallbackImage}
                        alt={fav.item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-bold uppercase tracking-tight leading-tight">{fav.item.title}</h2>
                      <span className="font-black text-lg whitespace-nowrap">
                        {formatEUR(fav.item.pricePerDayCents)}
                      </span>
                    </div>

                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                      {fav.item.location || "Onbekende locatie"}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                      Verhuurder: {ownerName}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Link
                        href={chatHref}
                        className="text-center bg-primary text-on-primary py-3 text-xs uppercase tracking-widest font-bold hover:bg-surface-dim hover:text-primary transition-colors"
                      >
                        Chat verhuurder
                      </Link>
                      <Link
                        href={`/products/${encodeURIComponent(fav.item.id)}`}
                        className="text-center border border-primary text-primary py-3 text-xs uppercase tracking-widest font-bold hover:bg-primary hover:text-on-primary transition-colors"
                      >
                        Bekijk post
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFavorite(fav.item.id)}
                      disabled={busyItemId === fav.item.id}
                      className="w-full mt-1 text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary disabled:opacity-60"
                    >
                      {busyItemId === fav.item.id ? "Verwijderen..." : "Verwijder uit favorieten"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
