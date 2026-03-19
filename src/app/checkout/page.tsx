"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatEUR } from "@/data/catalog";
import { useCart } from "@/state/cart";

type CheckoutFormState = {
  fullName: string;
  address: string;
  postalCode: string;
  city: string;
};

const ORDER_STORAGE_KEY = "gear2go_last_order_v1";

export default function CheckoutPage() {
  const router = useRouter();
  const { state, totals, clear } = useCart();
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    address: "",
    postalCode: "",
    city: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const canCheckout = state.lines.length > 0;

  const errors = useMemo(() => {
    if (!submitted) return {};
    return {
      fullName: form.fullName.trim().length === 0 ? "Vereist" : "",
      address: form.address.trim().length === 0 ? "Vereist" : "",
      postalCode: form.postalCode.trim().length === 0 ? "Vereist" : "",
      city: form.city.trim().length === 0 ? "Vereist" : "",
    };
  }, [form, submitted]);

  const hasErrors =
    Boolean(errors.fullName) ||
    Boolean(errors.address) ||
    Boolean(errors.postalCode) ||
    Boolean(errors.city);

  return (
    <div className="min-h-dvh pb-24">
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-[60] px-6 py-4 border-b border-outline-variant/15">
        <div className="flex items-center justify-between gap-4">
          <Link className="material-symbols-outlined text-primary" href="/cart">
            arrow_back
          </Link>
          <div className="font-headline font-black uppercase tracking-widest text-primary">
            Afrekenen
          </div>
          <span className="material-symbols-outlined text-primary opacity-0">
            arrow_back
          </span>
        </div>
      </header>

      <main className="px-6 py-10">
        {!canCheckout ? (
          <div className="bg-surface-container-low p-8">
            <h1 className="text-3xl font-black uppercase tracking-tighter font-headline">
              Geen items in je cart
            </h1>
            <Link
              href="/search"
              className="inline-block mt-6 bg-primary text-on-primary px-6 py-4 text-xs font-bold uppercase tracking-widest"
            >
              Zoek gear
            </Link>
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 font-headline">
                Verzendgegevens
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2 block">
                    Volledige Naam
                  </label>
                  <input
                    className={`w-full bg-surface-container-high border-none px-6 py-4 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium ${
                      errors.fullName ? "outline outline-2 outline-error" : ""
                    }`}
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Jan de Vries"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2 block">
                    Straat + Huisnummer
                  </label>
                  <input
                    className={`w-full bg-surface-container-high border-none px-6 py-4 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium ${
                      errors.address ? "outline outline-2 outline-error" : ""
                    }`}
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Keizersgracht 123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2 block">
                      Postcode
                    </label>
                    <input
                      className={`w-full bg-surface-container-high border-none px-6 py-4 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium ${
                        errors.postalCode ? "outline outline-2 outline-error" : ""
                      }`}
                      value={form.postalCode}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, postalCode: e.target.value }))
                      }
                      placeholder="1016 CJ"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2 block">
                      Stad
                    </label>
                    <input
                      className={`w-full bg-surface-container-high border-none px-6 py-4 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium ${
                        errors.city ? "outline outline-2 outline-error" : ""
                      }`}
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Amsterdam"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-10 bg-surface-container-low p-6">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6 font-headline">
                Samenvatting
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
                  <span>Subtotaal ({totals.rentalDays} dagen)</span>
                  <span>{formatEUR(totals.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>Borg</span>
                  <span>{formatEUR(totals.depositCents)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>Verzendkosten</span>
                  <span>{formatEUR(totals.shippingCents)}</span>
                </div>
                <div className="pt-4 flex justify-between text-2xl font-black uppercase tracking-tighter">
                  <span>Totaal</span>
                  <span>{formatEUR(totals.totalCents)}</span>
                </div>
              </div>
            </section>

            <button
              type="button"
              className="mt-8 block w-full bg-primary text-on-primary py-7 text-lg font-black uppercase tracking-[0.2em] hover:bg-surface-dim hover:text-primary transition-all active:scale-[0.98] text-center"
              onClick={() => {
                setSubmitted(true);
                if (hasErrors) return;

                const order = {
                  placedAt: new Date().toISOString(),
                  customer: form,
                  totals,
                  lineCount: state.lines.length,
                };
                window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
                clear();
                router.push("/checkout/confirmation");
              }}
            >
              Bestelling afronden
            </button>
          </>
        )}
      </main>
    </div>
  );
}

