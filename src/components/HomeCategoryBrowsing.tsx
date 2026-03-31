"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { categories, products, type CategoryId } from "@/data/catalog";
import { ProductCard, type ProductCardModel } from "@/components/ProductCard";

type ApiItem = {
  id: string;
  title: string;
  subtitle: string | null;
  location: string | null;
  pricePerDayCents: number;
  imageUrl: string | null;
  category: { slug: string; label: string } | null;
  owner: { displayName: string | null };
};

const fallbackImage =
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80";

type BrowseProduct = ProductCardModel & { categoryKey: string };

const iconByCategory: Record<CategoryId, string> = {
  watersport: "kayaking",
  wintersport: "downhill_skiing",
  bikes: "pedal_bike",
  camping: "camping",
  camera: "photo_camera",
  climbing: "landscape",
  audio: "piano",
};

function toCardModel(item: ApiItem): BrowseProduct {
  return {
    id: item.id,
    title: item.title,
    imageUrl: item.imageUrl?.trim() || fallbackImage,
    pricePerDayCents: item.pricePerDayCents,
    location: item.location?.trim() || "Nederland",
    tags: [item.subtitle?.trim() || "Community", item.owner.displayName?.trim() || "Verhuurder"],
    categoryKey: item.category?.slug || "overig",
  };
}

const staticProducts: BrowseProduct[] = products.map((p) => ({
  id: p.id,
  title: p.title,
  imageUrl: p.imageUrl,
  pricePerDayCents: p.pricePerDayCents,
  location: p.location,
  tags: p.tags,
  categoryKey: p.categoryId,
}));

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const uniqueById = (list: BrowseProduct[]) => {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export function HomeCategoryBrowsing() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<"all" | CategoryId>("all");
  const [sortBy, setSortBy] = useState<"priceAsc" | "none">("priceAsc");
  const [dbProducts, setDbProducts] = useState<BrowseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const q = (searchParams.get("q") ?? "").trim();

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as { items?: ApiItem[] } | null;
        if (!cancelled && res.ok) {
          setDbProducts((data?.items ?? []).map(toCardModel));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadItems();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAndSorted = useMemo(() => {
    const merged = uniqueById([...dbProducts, ...staticProducts]);
    const query = normalize(q);
    const scoped = merged.filter((p) => {
      if (selectedCategory !== "all" && p.categoryKey !== selectedCategory) return false;
      if (!query) return true;
      const haystack = normalize(`${p.title} ${p.location} ${p.tags.join(" ")}`);
      return haystack.includes(query);
    });
    if (sortBy === "priceAsc") {
      return [...scoped].sort((a, b) => a.pricePerDayCents - b.pricePerDayCents);
    }
    return scoped;
  }, [dbProducts, q, selectedCategory, sortBy]);

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
              <span className="material-symbols-outlined block mb-2">{iconByCategory[category.id]}</span>
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
