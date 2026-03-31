"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

type BrowseCategory = {
  slug: string;
  label: string;
  icon: string;
};

type BrowseItem = ProductCardData & {
  categorySlug: string;
};

const CATEGORY_ORDER: BrowseCategory[] = [
  { slug: "watersporten", label: "Watersporten", icon: "kayaking" },
  { slug: "wintersport", label: "Wintersport", icon: "downhill_skiing" },
  { slug: "fietssporten", label: "Fietssporten", icon: "pedal_bike" },
  { slug: "balsporten", label: "Balsporten", icon: "sports_soccer" },
  { slug: "overige_sporten", label: "Overige Sporten", icon: "deployed_code" },
  { slug: "transport_baggage", label: "Transport & Baggage", icon: "luggage" },
];

export function HomeCategoryBrowsing() {
  const searchParams = useSearchParams();
  const [categories] = useState<BrowseCategory[]>(CATEGORY_ORDER);
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_ORDER[0]!.slug);
  const [sortBy, setSortBy] = useState<"priceAsc" | "none">("priceAsc");
  const [loading, setLoading] = useState(true);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const queryPart = q ? `?q=${encodeURIComponent(q)}` : "";
        const itemsRes = await fetch(`/api/items${queryPart}`, { cache: "no-store" });
        const itemsJson = (await itemsRes.json()) as {
          items?: Array<{
            id: string;
            title: string;
            subtitle?: string | null;
            location?: string | null;
            pricePerDayCents: number;
            imageUrl?: string | null;
            category?: { slug?: string | null; label?: string | null } | null;
          }>;
        };

        if (cancelled) return;

        const nextItems: BrowseItem[] = (itemsJson.items ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          location: item.location ?? "Onbekende locatie",
          pricePerDayCents: item.pricePerDayCents,
          imageUrl:
            item.imageUrl ||
            "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
          tags: [item.subtitle ?? item.category?.label ?? "Gear"],
          categorySlug: item.category?.slug ?? "",
        }));

        setItems(nextItems);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [q]);

  const filteredAndSorted = useMemo(() => {
    const scoped = items.filter((item) => item.categorySlug === selectedCategory);
    if (sortBy === "priceAsc") {
      return [...scoped].sort((a, b) => a.pricePerDayCents - b.pricePerDayCents);
    }
    return scoped;
  }, [items, selectedCategory, sortBy]);

  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-surface">
      <div className="mb-10">
        <h2 className="font-headline font-black text-4xl md:text-6xl uppercase tracking-tighter text-primary">
          Categorie Browsing
        </h2>
        <p className="font-body text-on-surface-variant mt-2 max-w-2xl">
          Selecteer een categorie om direct alle andere items uit te filteren. Binnen de categorie kun je sorteren op prijs (laag naar hoog).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
        {categories.map((category) => {
          const active = category.slug === selectedCategory;
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => setSelectedCategory(category.slug)}
              className={`p-4 border transition-all text-left ${
                active
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined block mb-2" aria-hidden="true">{category.icon}</span>
              <span className="text-[11px] md:text-xs uppercase tracking-widest font-bold">{category.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end mb-6">
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
      </div>

      {loading ? (
        <div className="bg-surface-container-low p-8">
          <p className="uppercase text-xs tracking-widest text-on-surface-variant">Items laden...</p>
        </div>
      ) : filteredAndSorted.length === 0 ? (
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
