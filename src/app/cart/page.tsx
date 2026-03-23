"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { NavSearchBar } from "@/components/NavSearchBar";
import { formatEUR, getProductById } from "@/data/catalog";
import { useCart } from "@/state/cart";

export default function CartPage() {
  const { state, totals, removeLine, setDatesForAll } = useCart();

  const lines = useMemo(
    () =>
      state.lines
        .map((l) => ({ product: getProductById(l.productId), productId: l.productId }))
        .filter((x) => Boolean(x.product)),
    [state.lines],
  );

  return (
    <div className="min-h-dvh pb-28 md:pb-0 bg-surface text-on-surface">
      <header className="bg-white text-primary sticky top-0 z-50 border-b border-outline-variant/20">
        <div className="flex justify-between items-center px-6 md:px-12 py-5">
          <Link className="text-2xl md:text-3xl font-black tracking-tighter" href="/">
            GEAR2GO
          </Link>
          <nav className="hidden md:flex gap-10 items-center">
            <Link className="text-on-surface-variant font-headline uppercase tracking-widest hover:bg-surface-dim px-2" href="/ontdekken">
              Zoeken
            </Link>
            <Link className="text-on-surface-variant font-headline uppercase tracking-widest hover:bg-surface-dim px-2" href="/hoe-het-werkt">
              Hoe het werkt
            </Link>
            <NavSearchBar />
          </nav>
          <div className="flex items-center gap-6">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            <Link className="hidden md:inline font-headline font-bold uppercase tracking-widest hover:bg-surface-dim px-4 py-1" href="/berichten">
              Berichten
            </Link>
            <Link className="material-symbols-outlined md:hidden" href="/ontdekken">
              arrow_back
            </Link>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-140px)]">
        <aside className="bg-surface-container-low text-primary flex-col pt-12 w-64 hidden lg:flex">
          <div className="px-6 mb-8">
            <span className="text-[10px] tracking-[0.2em] font-bold text-on-surface-variant">STAPPEN</span>
            <h2 className="font-body text-sm font-bold uppercase tracking-tighter">CHECKOUT</h2>
          </div>
          <nav>
            <div className="bg-primary text-on-primary flex items-center gap-4 px-6 py-4 w-full">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span className="font-body text-sm font-bold uppercase tracking-tighter">Overzicht</span>
            </div>
            <div className="text-on-surface-variant flex items-center gap-4 px-6 py-4 w-full hover:bg-surface-container-highest transition-all">
              <span className="material-symbols-outlined">local_shipping</span>
              <span className="font-body text-sm font-bold uppercase tracking-tighter">Verzending</span>
            </div>
            <div className="text-on-surface-variant flex items-center gap-4 px-6 py-4 w-full hover:bg-surface-container-highest transition-all">
              <span className="material-symbols-outlined">payments</span>
              <span className="font-body text-sm font-bold uppercase tracking-tighter">Betaling</span>
            </div>
            <div className="text-on-surface-variant flex items-center gap-4 px-6 py-4 w-full hover:bg-surface-container-highest transition-all">
              <span className="material-symbols-outlined">verified</span>
              <span className="font-body text-sm font-bold uppercase tracking-tighter">Bevestiging</span>
            </div>
          </nav>
        </aside>

        <section className="flex-1 px-6 md:px-16 py-10 md:py-12 bg-surface">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-12 md:mb-16 leading-none font-headline">
              Winkelwagen
            </h1>

        {lines.length === 0 ? (
              <div className="bg-surface-container-low p-8">
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">
                  Cart
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mt-2 font-headline">
                  Je winkelwagen is leeg
                </h2>
                <Link
                  href="/ontdekken"
                  className="inline-block mt-6 bg-primary text-on-primary px-6 py-4 text-xs font-bold uppercase tracking-widest"
                >
                  Naar zoeken
                </Link>
              </div>
        ) : (
          <>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                <div className="xl:col-span-8 space-y-8">
                  <section className="bg-surface-container-low p-6">
                    <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">
                      Huurperiode
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="date"
                        className="w-full bg-surface-container-high border-none px-4 py-3 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium"
                        value={state.lines[0]?.startDateISO ?? ""}
                        onChange={(e) =>
                          setDatesForAll(e.target.value, state.lines[0]?.endDateISO ?? "")
                        }
                      />
                      <input
                        type="date"
                        className="w-full bg-surface-container-high border-none px-4 py-3 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium"
                        value={state.lines[0]?.endDateISO ?? ""}
                        onChange={(e) =>
                          setDatesForAll(state.lines[0]?.startDateISO ?? "", e.target.value)
                        }
                      />
                    </div>
                    <div className="mt-3 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                      {totals.rentalDays} dagen
                    </div>
                  </section>

                  <section className="space-y-8">
                    {lines.map(({ product }) => {
                      const p = product!;
                      return (
                        <article
                          key={p.id}
                          className="bg-surface-container-lowest p-0 flex flex-col md:flex-row"
                        >
                          <div className="w-full md:w-64 h-64 overflow-hidden bg-surface-container">
                            <img
                              alt={p.title}
                              src={p.imageUrl}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 p-8 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-on-surface-variant">
                                  {p.subtitle}
                                </span>
                                <h3 className="text-3xl font-bold uppercase tracking-tight mt-1 font-headline">
                                  {p.title}
                                </h3>
                                <p className="text-on-surface-variant mt-2 font-medium">
                                  {p.location}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors"
                                onClick={() => removeLine(p.id)}
                                aria-label="Remove"
                              >
                                close
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                              <div className="bg-surface-container-low p-4">
                                <span className="text-[9px] uppercase tracking-widest block mb-1">
                                  Huurperiode
                                </span>
                                <span className="font-bold text-sm">
                                  {totals.rentalDays} dagen
                                </span>
                              </div>
                              <div className="bg-surface-container-low p-4">
                                <span className="text-[9px] uppercase tracking-widest block mb-1">
                                  Dagprijs
                                </span>
                                <span className="font-bold text-sm">
                                  {formatEUR(p.pricePerDayCents)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </section>
                </div>

                <div className="xl:col-span-4">
                  <section className="bg-surface-container-low p-8 sticky top-28">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b border-outline-variant pb-4 font-headline">
                      Overzicht
                    </h2>
                    <div className="space-y-6 mb-12">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                          Subtotaal ({totals.rentalDays} dagen)
                        </span>
                        <span className="font-bold">{formatEUR(totals.subtotalCents)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                          Servicekosten
                        </span>
                        <span className="font-bold">{formatEUR(totals.shippingCents)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                          Borg (Restitueerbaar)
                        </span>
                        <span className="font-bold">{formatEUR(totals.depositCents)}</span>
                      </div>
                      <div className="pt-6 border-t border-outline-variant flex justify-between items-end">
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-widest block text-on-surface-variant">
                            Totaalbedrag
                          </span>
                          <span className="text-4xl font-black tracking-tighter">
                            {formatEUR(totals.totalCents)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/checkout"
                      className="w-full bg-primary text-on-primary font-headline font-black uppercase tracking-[0.2em] py-6 px-4 flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-surface-dim hover:text-primary group"
                    >
                      Ga naar afrekenen
                      <span className="material-symbols-outlined transform group-hover:translate-x-2 transition-transform">
                        arrow_forward
                      </span>
                    </Link>

                    <div className="mt-8 flex items-start gap-3 bg-surface-container p-4">
                      <span
                        className="material-symbols-outlined text-on-surface-variant"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified_user
                      </span>
                      <p className="text-[10px] uppercase font-bold leading-relaxed tracking-tight">
                        Veilig huren via Gear2Go. Je betaling is beschermd tot de gear is opgehaald.
                      </p>
                    </div>
                  </section>
                </div>
              </div>
              <section className="mt-24">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-12 font-headline">
                  Vergeet deze niet
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    ["Huurverzekering", "Dekking voor schade en diefstal.", "EUR 4,99 / dag"],
                    ["MTB Helm", "Giro Source MIPS - Veiligheid eerst.", "EUR 15,00 / trip"],
                    ["Reinigingsset", "Lever je gear weer blinkend in.", "EUR 7,50 / trip"],
                  ].map(([title, text, price]) => (
                    <div
                      key={title}
                      className="bg-surface-container-low p-6 flex flex-col justify-between h-48 group hover:bg-surface-container-highest transition-colors cursor-pointer"
                    >
                      <div>
                        <h4 className="font-bold uppercase tracking-tight text-xl">{title}</h4>
                        <p className="text-xs text-on-surface-variant mt-2">{text}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-black">{price}</span>
                        <span className="material-symbols-outlined text-primary group-hover:scale-125 transition-transform">
                          add_circle
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </main>

      <footer className="hidden md:flex bg-[#000000] text-[#e2e2e2] justify-between items-center px-12 py-8 w-full font-body text-[10px] uppercase tracking-[0.2em]">
        <div className="flex gap-8">
          <Link className="text-[#c6c6c6] hover:text-[#ffffff] transition-colors" href="/">
            Privacy
          </Link>
          <Link className="text-[#c6c6c6] hover:text-[#ffffff] transition-colors" href="/">
            Voorwaarden
          </Link>
          <Link className="text-[#c6c6c6] hover:text-[#ffffff] transition-colors" href="/hoe-het-werkt">
            Helpdesk
          </Link>
        </div>
        <div>© 2024 GEAR2GO. KINETIC EDITORIAL ARCHITECTURE.</div>
      </footer>

      <div className="md:hidden">
        <BottomNav active="rentals" />
      </div>
    </div>
  );
}

