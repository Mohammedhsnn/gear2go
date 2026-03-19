"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEUR } from "@/data/catalog";

const ORDER_STORAGE_KEY = "gear2go_last_order_v1";

type Order = {
  placedAt: string;
  customer: { fullName: string; address: string; postalCode: string; city: string };
  totals: {
    rentalDays: number;
    subtotalCents: number;
    depositCents: number;
    shippingCents: number;
    totalCents: number;
  };
  lineCount: number;
};

function loadOrder(): Order | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Order;
  } catch {
    return null;
  }
}

export default function ConfirmationPage() {
  const [order] = useState<Order | null>(loadOrder);

  return (
    <div className="font-body text-on-background selection:bg-primary selection:text-on-primary">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl px-6 py-6 flex justify-between items-center">
        <div className="font-headline font-black text-3xl tracking-tighter uppercase">
          EQUIPMENT
        </div>
        <Link
          className="w-10 h-10 flex items-center justify-center bg-surface-container-highest hover:bg-surface-dim active:scale-95 transition-all"
          href="/"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </Link>
      </header>

      <main className="min-h-screen pb-32">
        <section className="px-6 pt-12 pb-8">
          <div className="label-sm font-label uppercase tracking-[0.2em] text-on-surface-variant mb-4">
            Bevestiging
          </div>
          <h1 className="font-headline text-5xl font-bold uppercase leading-[0.9] tracking-tighter mb-6">
            Bedankt voor je bestelling!
          </h1>
          <div className="flex items-center gap-2 bg-primary text-on-primary px-4 py-3 inline-flex">
            <span className="font-label text-xs uppercase tracking-widest">Order ID:</span>
            <span className="font-headline font-bold">
              #{order ? `G2-${order.lineCount}${new Date(order.placedAt).getTime().toString().slice(-4)}` : "G2-ORDER"}
            </span>
          </div>
        </section>

        <section className="px-6 mb-12">
          <div className="bg-surface-container-low p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-surface-container-high rotate-45 translate-x-16 -translate-y-16" />
            <h2 className="font-headline text-2xl font-bold uppercase mb-8 border-b border-outline-variant/20 pb-4">
              Huurafspraak
            </h2>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  Producten
                </div>
                <div className="font-headline text-xl font-bold">
                  {order ? `${order.lineCount} item(s)` : "Je bestelling"}
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    Periode
                  </div>
                  <div className="font-body font-medium">
                    {order ? `${order.totals.rentalDays} dagen` : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    Totaal
                  </div>
                  <div className="font-headline font-bold text-2xl">
                    {order ? formatEUR(order.totals.totalCents) : formatEUR(0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 mb-12">
          <h2 className="font-headline text-sm font-bold uppercase tracking-[0.3em] mb-6">
            Volgende Stappen
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              {
                n: "01",
                title: "Bericht de eigenaar",
                desc: "Stuur een bericht om de ophaaltijd en locatie af te stemmen.",
              },
              {
                n: "02",
                title: "Identificatie",
                desc: "Neem een geldig identiteitsbewijs mee bij het ophalen.",
              },
              {
                n: "03",
                title: "Checklist",
                desc: "Loop samen de checklist door en maak foto’s van de staat.",
              },
            ].map((s) => (
              <div key={s.n} className="bg-surface-container-lowest p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-black text-white flex-shrink-0 flex items-center justify-center font-headline font-bold">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-headline font-bold uppercase text-lg mb-2">
                    {s.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 mb-12">
          <div className="h-48 bg-surface-container-high relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#d1d1d1_0.5px,transparent_0.5px)] [background-size:20px_20px]" />
            <div className="relative z-10 text-center">
              <span
                className="material-symbols-outlined text-6xl text-primary mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <div className="font-headline font-black uppercase text-xs tracking-widest">
                Gear Secured
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex flex-col gap-3 z-50">
        <button
          className="w-full bg-primary text-on-primary font-headline font-bold uppercase py-5 text-sm tracking-widest hover:bg-surface-dim hover:text-primary active:scale-[0.98] transition-all"
          type="button"
          onClick={() => alert("Proof case: inbox/chat komt later.")}
        >
          Bericht eigenaar
        </button>
        <Link
          className="w-full bg-transparent text-primary border border-outline-variant/30 font-headline font-bold uppercase py-5 text-sm tracking-widest hover:bg-surface-container-low active:scale-[0.98] transition-all text-center"
          href="/search"
        >
          Bekijk bestelling
        </Link>
      </div>
    </div>
  );
}

