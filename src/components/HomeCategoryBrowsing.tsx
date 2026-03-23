"use client";

import { useMemo, useState } from "react";
import { categories, products, type CategoryId } from "@/data/catalog";
import { ProductCard } from "@/components/ProductCard";

const iconByCategory: Record<CategoryId, string> = {
  watersport: "kayaking",
  wintersport: "downhill_skiing",
  bikes: "pedal_bike",
  camping: "camping",
  camera: "photo_camera",
  climbing: "landscape",
  audio: "piano",
};

export function HomeCategoryBrowsing() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(categories[0]!.id);
  const [sortBy, setSortBy] = useState<"priceAsc" | "none">("priceAsc");

  const filteredAndSorted = useMemo(() => {
    const scoped = products.filter((p) => p.categoryId === selectedCategory);
    if (sortBy === "priceAsc") {
      return [...scoped].sort((a, b) => a.pricePerDayCents - b.pricePerDayCents);
    }
    return scoped;
  }, [selectedCategory, sortBy]);

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

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-12">
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
