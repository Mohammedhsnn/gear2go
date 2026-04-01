import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BottomNav } from "@/components/BottomNav";
import { FavoriteToggleButton } from "@/components/FavoriteToggleButton";
import { NavSearchBar } from "@/components/NavSearchBar";
import { formatEUR, getProductById } from "@/data/catalog";
import { prisma } from "@/lib/prisma";

type ProductDetail = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  pricePerDayCents: number;
  imageUrl: string;
  ownerName: string;
  description: string;
};

async function getProductDetailById(id: string): Promise<ProductDetail | null> {
  const catalogProduct = getProductById(id);
  if (catalogProduct) {
    return {
      ...catalogProduct,
      ownerName: "Mark J.",
      description: "Proof case product detail. In de echte versie komt dit uit je backend.",
    };
  }

  const item = await prisma.item.findUnique({
    where: { id },
    include: { owner: { select: { displayName: true } }, category: true },
  });
  if (!item || item.status !== "PUBLISHED") return null;

  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle?.trim() || item.category?.label || "Gear",
    location: item.location?.trim() || "Nederland",
    pricePerDayCents: item.pricePerDayCents,
    imageUrl:
      item.imageUrl?.trim() ||
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    ownerName: item.owner.displayName?.trim() || "Verhuurder",
    description:
      item.description?.trim() ||
      "Deze listing is geplaatst door een verhuurder op Gear2Go. Neem contact op voor details en beschikbaarheid.",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductDetailById(id);
  if (!product) notFound();

  const chatHref = `/berichten?owner=${encodeURIComponent(product.ownerName)}&product=${encodeURIComponent(product.title)}&itemId=${encodeURIComponent(product.id)}`;
  const mapQuery = `${product.location}, Nederland`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="min-h-dvh pb-32 md:pb-0">
      <header className="fixed top-0 z-[60] w-full bg-surface bg-opacity-80 backdrop-blur-md">
        <div className="md:hidden flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <Link className="flex items-center" href="/ontdekken">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </Link>
            <span className="text-xl font-bold tracking-tighter text-primary uppercase font-headline">
              GEAR_RENTAL
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary cursor-pointer">
              share
            </span>
            <FavoriteToggleButton itemId={product.id} className="text-primary cursor-pointer" />
          </div>
        </div>
        <div className="hidden md:flex justify-between items-center px-6 md:px-12 py-6">
          <Link className="text-3xl font-black tracking-tighter text-primary font-headline uppercase" href="/">
            GEAR2GO
          </Link>
          <NavSearchBar />
        </div>
      </header>
      <main className="pt-32 pb-20 px-8 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <img className="w-full aspect-[4/5] object-cover" src={product.imageUrl} alt={product.title} />
            <p className="mt-6 text-on-surface-variant">{product.description}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{product.subtitle}</p>
            <h1 className="text-5xl font-black tracking-tight leading-none my-3 font-headline uppercase">{product.title}</h1>
            <p className="mb-3">{product.location}</p>
            <p className="text-3xl font-bold mb-6">{formatEUR(product.pricePerDayCents)} / dag</p>
            <Link className="block bg-primary text-on-primary px-6 py-4 font-bold uppercase tracking-widest text-center" href={chatHref}>
              Chat met Verhuurder
            </Link>
            <div className="mt-4">
              <AddToCartButton productId={product.id} />
            </div>
            <div className="mt-8 rounded-xl border border-outline-variant/30 bg-surface overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
                <p className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">{product.location}, Nederland</p>
                <a className="text-[10px] uppercase tracking-widest text-primary" href={mapLink} target="_blank" rel="noreferrer">
                  Open Maps
                </a>
              </div>
              <iframe className="w-full h-72" src={mapEmbedUrl} title={`Locatie van ${product.title}`} loading="lazy" />
            </div>
          </div>
        </div>
      </main>
      <BottomNav active="explore" />
    </div>
  );
}
