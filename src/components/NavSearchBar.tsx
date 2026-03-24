"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatEUR, products } from "@/data/catalog";

export function NavSearchBar() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return [];

    return products
      .filter((product) => {
        const haystack = [
          product.title,
          product.subtitle,
          product.location,
          ...product.tags,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 6);
  }, [query]);

  return (
    <form className="hidden lg:block" onSubmit={(e) => e.preventDefault()}>
      <div className="relative">
        <input
          type="text"
          placeholder="Zoeken..."
          className="w-52 bg-surface-container-high border-none px-4 py-2 text-sm focus:ring-1 focus:ring-primary"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 120);
          }}
        />
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">
          search
        </span>
        {open && query ? (
          <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-md border border-outline-variant bg-surface shadow-lg z-50">
            {results.length > 0 ? (
              <ul className="max-h-80 overflow-auto py-1">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.id}`}
                      className="block px-3 py-2 hover:bg-surface-container-high text-sm"
                    >
                      <div className="font-medium text-on-surface">{product.title}</div>
                      <div className="text-xs text-on-surface-variant">
                        {product.subtitle} - {formatEUR(product.pricePerDayCents)} / dag
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-2 text-sm text-on-surface-variant">
                Geen producten gevonden
              </div>
            )}
          </div>
        ) : null}
      </div>
    </form>
  );
}
