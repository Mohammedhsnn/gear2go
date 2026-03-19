import Link from "next/link";
import { formatEUR, type Product } from "@/data/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${encodeURIComponent(product.id)}`}
      className="bg-surface p-6 group cursor-pointer hover:bg-surface-container-highest transition-all duration-300 block"
    >
      <div className="aspect-square bg-surface-container-high mb-8 overflow-hidden">
        <img
          alt={product.title}
          className="w-full h-full object-cover grayscale group-hover:scale-110 group-hover:grayscale-0 transition-all duration-500"
          src={product.imageUrl}
        />
      </div>
      <div className="flex justify-between items-start mb-3 gap-4">
        <h3 className="font-bold text-xl uppercase leading-tight group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        <span className="font-black text-xl">{formatEUR(product.pricePerDayCents)}</span>
      </div>
      <p className="text-on-surface-variant text-xs uppercase tracking-wider font-semibold mb-6">
        {product.location} • Dagprijs
      </p>
      <div className="flex gap-2 flex-wrap">
        {product.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className={
              t === "Premium" || t === "Pro Gear" || t === "Hiking"
                ? "bg-primary text-on-primary px-3 py-1 text-[10px] font-bold uppercase tracking-tighter"
                : "bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-tighter"
            }
          >
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}

