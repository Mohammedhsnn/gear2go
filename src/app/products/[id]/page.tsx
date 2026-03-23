import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BottomNav } from "@/components/BottomNav";
import { formatEUR, getProductById } from "@/data/catalog";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();
  const ownerName = "Mark J.";
  const chatHref = `/berichten?owner=${encodeURIComponent(ownerName)}&product=${encodeURIComponent(product.title)}&itemId=${encodeURIComponent(product.id)}`;

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
            <span className="material-symbols-outlined text-primary cursor-pointer">
              favorite
            </span>
          </div>
        </div>

        <div className="hidden md:flex justify-between items-center px-6 md:px-12 py-6">
          <Link className="text-3xl font-black tracking-tighter text-primary font-headline uppercase" href="/">
            GEAR2GO
          </Link>
          <div className="hidden md:flex items-center gap-12">
            <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/">
              HOME
            </Link>
            <Link className="font-headline tracking-tight uppercase text-sm font-bold text-primary border-b-4 border-primary pb-1" href="/ontdekken">
              ONTDEKKEN
            </Link>
            <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/hoe-het-werkt">
              HOE HET WERKT
            </Link>
            <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/berichten">
              BERICHTEN
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link className="font-headline tracking-tight uppercase text-sm font-bold bg-primary text-on-primary px-6 py-3 hover:bg-surface-dim hover:text-primary transition-colors duration-100 hidden md:inline-flex" href="/gearplaatsen">
              GEAR PLAATSEN
            </Link>
            <Link href="/cart" className="material-symbols-outlined text-3xl cursor-pointer">
              shopping_basket
            </Link>
            <Link href="/dashboard" className="material-symbols-outlined text-3xl cursor-pointer">
              account_circle
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile */}
      <main className="pb-24 md:hidden pt-[72px]">
        <section className="relative w-full aspect-[4/5] bg-surface-container overflow-hidden">
          <img
            className="w-full h-full object-cover grayscale brightness-90 contrast-110"
            alt={product.title}
            src={product.imageUrl}
          />
          <div className="absolute bottom-6 left-6 bg-primary px-3 py-1">
            <span className="text-on-primary font-label text-[10px] tracking-[0.2em] uppercase">
              {product.tags[0] ?? "Gear"}
            </span>
          </div>
        </section>

        <section className="px-6 py-8 bg-surface">
          <div className="flex flex-col gap-2">
            <span className="text-on-surface-variant font-label text-xs tracking-[0.1em] uppercase">
              {product.subtitle}
            </span>
            <h1 className="text-4xl font-bold tracking-tighter leading-none text-primary uppercase font-headline">
              {product.title}
            </h1>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {formatEUR(product.pricePerDayCents)}
              </span>
              <span className="text-on-surface-variant font-label text-sm uppercase">
                / dag
              </span>
            </div>
          </div>
        </section>

        <section className="px-6 py-12 bg-surface">
          <h2 className="text-sm font-label tracking-[0.2em] uppercase mb-6 text-primary">
            Beschrijving
          </h2>
          <p className="text-body-md leading-relaxed text-on-surface-variant max-w-prose">
            Proof case product detail. In de echte versie komt dit uit je backend.
          </p>
        </section>
      </main>

      {/* Desktop */}
      <main className="hidden md:block pt-32 pb-20 px-8 max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row gap-16">
          <div className="w-full md:w-7/12">
            <div className="bg-surface-container-low aspect-[4/5] relative overflow-hidden group">
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={product.title}
                src={product.imageUrl}
              />
              <div className="absolute top-6 left-6 bg-primary text-on-primary px-4 py-2 font-headline text-xs uppercase tracking-widest">
                {product.tags[0] ?? "Top Segment"}
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-surface-container-low aspect-square" />
              ))}
            </div>
          </div>

          <div className="w-full md:w-5/12 flex flex-col">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-on-surface-variant font-label">
                {product.subtitle}
              </span>
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-none mb-6 font-headline uppercase">
              {product.title}
            </h1>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-4xl font-bold font-headline">
                {formatEUR(product.pricePerDayCents)}
              </span>
              <span className="text-on-surface-variant font-label uppercase tracking-widest text-sm">
                / per dag
              </span>
            </div>

            <div className="space-y-12">
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-outline-variant/20 pb-2">
                  Technische Specificaties
                </h3>
                <div className="grid grid-cols-2 gap-px bg-outline-variant/20 border border-outline-variant/20">
                  {[
                    ["Frame", "Carbon"],
                    ["Maat", "L"],
                    ["Gewicht", "10.2 kg"],
                    ["Wielmaat", "29 inch"],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-surface p-6">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-label">
                        {k}
                      </p>
                      <p className="text-xl font-bold font-headline uppercase">{v}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-surface-container-low p-8">
                <h3 className="text-xs font-black uppercase tracking-widest mb-6">
                  Verhuurder
                </h3>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-surface-container-highest overflow-hidden" />
                  <div className="flex flex-col">
                    <span className="text-xl font-bold font-headline">Mark J.</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-sm font-bold">4.9</span>
                      <span className="text-xs text-on-surface-variant">(128 reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    className="w-full bg-primary text-on-primary py-4 px-6 font-headline font-bold uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all active:scale-95 duration-75 text-center"
                    href={chatHref}
                  >
                    Chat met Verhuurder
                  </Link>
                </div>
              </section>

              <section className="mt-auto">
                <AddToCartButton
                  productId={product.id}
                  className="block w-full bg-surface-container-lowest border border-outline-variant/30 py-6 px-6 font-headline font-black text-2xl uppercase tracking-tighter hover:bg-primary hover:text-on-primary transition-all active:scale-95 duration-75 text-center"
                  label="Direct Huren"
                />
                <p className="text-[10px] text-center mt-4 text-on-surface-variant uppercase tracking-widest font-label">
                  Inclusief basisverzekering &amp; Servicekosten
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white px-6 py-6 flex flex-col gap-3 shadow-ambient md:hidden">
        <div className="grid grid-cols-2 gap-3">
          <Link
            className="flex items-center justify-center gap-2 border border-outline-variant/40 bg-transparent text-primary py-4 font-label text-xs tracking-widest uppercase hover:bg-surface-dim transition-colors duration-100"
            href={chatHref}
          >
            <span className="material-symbols-outlined text-sm">chat_bubble</span>
            BERICHT
          </Link>
          <AddToCartButton productId={product.id} />
        </div>
      </footer>

      <BottomNav active="explore" />
    </div>
  );
}

