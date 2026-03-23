"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatEUR, getProductById } from "@/data/catalog";
import { useCart } from "@/state/cart";

type CheckoutFormState = {
  fullName: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
};

const ORDER_STORAGE_KEY = "gear2go_last_order_v1";

function isValidEmail(email: string): boolean {
  // Requires local-part@domain.tld and disallows spaces.
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email.trim());
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state, totals, clear } = useCart();
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    email: "",
    address: "",
    postalCode: "",
    city: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCheckout = state.lines.length > 0;

  const errors = useMemo(() => {
    if (!submitted) return {};
    return {
      fullName: form.fullName.trim().length === 0 ? "Vereist" : "",
      email:
        form.email.trim().length === 0
          ? "Vereist"
          : !isValidEmail(form.email)
            ? "Gebruik een geldig e-mailadres (bijv. naam@domein.nl)."
            : "",
      address: form.address.trim().length === 0 ? "Vereist" : "",
      postalCode: form.postalCode.trim().length === 0 ? "Vereist" : "",
      city: form.city.trim().length === 0 ? "Vereist" : "",
    };
  }, [form, submitted]);

  const hasErrors =
    Boolean(errors.fullName) ||
    Boolean(errors.email) ||
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
                    Volledige Naam *
                  </label>
                  <input
                    required
                    className={`w-full bg-surface-container-high border-none px-6 py-4 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium ${
                      errors.fullName ? "outline outline-2 outline-error" : ""
                    }`}
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Jan de Vries"
                  />
                  {errors.fullName ? <p className="text-xs text-error mt-2">{errors.fullName}</p> : null}
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2 block">
                    E-mail *
                  </label>
                  <input
                    required
                    type="email"
                    className={`w-full bg-surface-container-high border-none px-6 py-4 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium ${
                      errors.email ? "outline outline-2 outline-error" : ""
                    }`}
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="jan@voorbeeld.nl"
                  />
                  {errors.email ? <p className="text-xs text-error mt-2">{errors.email}</p> : null}
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2 block">
                    Straat + Huisnummer *
                  </label>
                  <input
                    required
                    className={`w-full bg-surface-container-high border-none px-6 py-4 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium ${
                      errors.address ? "outline outline-2 outline-error" : ""
                    }`}
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Keizersgracht 123"
                  />
                  {errors.address ? <p className="text-xs text-error mt-2">{errors.address}</p> : null}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2 block">
                      Postcode *
                    </label>
                    <input
                      required
                      className={`w-full bg-surface-container-high border-none px-6 py-4 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium ${
                        errors.postalCode ? "outline outline-2 outline-error" : ""
                      }`}
                      value={form.postalCode}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, postalCode: e.target.value }))
                      }
                      placeholder="1016 CJ"
                    />
                    {errors.postalCode ? <p className="text-xs text-error mt-2">{errors.postalCode}</p> : null}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2 block">
                      Stad *
                    </label>
                    <input
                      required
                      className={`w-full bg-surface-container-high border-none px-6 py-4 focus:ring-0 focus:bg-surface-container-highest transition-all font-medium ${
                        errors.city ? "outline outline-2 outline-error" : ""
                      }`}
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Amsterdam"
                    />
                    {errors.city ? <p className="text-xs text-error mt-2">{errors.city}</p> : null}
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
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>Extra opties</span>
                  <span>{formatEUR(totals.addOnsCents)}</span>
                </div>
                <div className="pt-4 flex justify-between text-2xl font-black uppercase tracking-tighter">
                  <span>Totaal</span>
                  <span>{formatEUR(totals.totalCents)}</span>
                </div>
              </div>
            </section>

            {submitError ? (
              <div className="mt-6 bg-[#fee2e2] text-[#991b1b] px-5 py-4 text-sm font-semibold">
                {submitError}
              </div>
            ) : null}

            <button
              type="button"
              className="mt-8 block w-full bg-primary text-on-primary py-7 text-lg font-black uppercase tracking-[0.2em] hover:bg-surface-dim hover:text-primary transition-all active:scale-[0.98] text-center disabled:opacity-60"
              disabled={isSubmitting}
              onClick={async () => {
                if (isSubmitting) return;
                setSubmitted(true);
                setSubmitError(null);
                const currentHasErrors =
                  form.fullName.trim().length === 0 ||
                  form.email.trim().length === 0 ||
                  !isValidEmail(form.email) ||
                  form.address.trim().length === 0 ||
                  form.postalCode.trim().length === 0 ||
                  form.city.trim().length === 0;
                if (currentHasErrors || hasErrors) return;

                setIsSubmitting(true);

                const bookingRequests = state.lines.map((line) => ({
                  itemId: line.productId,
                  startDateISO: line.startDateISO,
                  endDateISO: line.endDateISO,
                }));

                const bookingResults: Array<{ id: string; status: string }> = [];

                for (const request of bookingRequests) {
                  const response = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(request),
                  });

                  if (!response.ok) {
                    const body = (await response.json().catch(() => null)) as
                      | { error?: string }
                      | null;

                    setSubmitError(
                      body?.error ||
                        "Boeking kon niet worden aangevraagd. Controleer item en data.",
                    );
                    setIsSubmitting(false);
                    return;
                  }

                  const payload = (await response.json()) as {
                    booking: { id: string; status: string };
                  };
                  bookingResults.push({
                    id: payload.booking.id,
                    status: payload.booking.status,
                  });
                }

                const order = {
                  placedAt: new Date().toISOString(),
                  customer: form,
                  totals,
                  lineCount: state.lines.length,
                  bookingStatuses: bookingResults,
                  chatContext: (() => {
                    const first = state.lines[0];
                    if (!first) return null;
                    const product = getProductById(first.productId);
                    return {
                      productId: first.productId,
                      productTitle: product?.title ?? "Gehuurd item",
                      ownerName: "Mark J.",
                    };
                  })(),
                };
                window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
                clear();
                setIsSubmitting(false);
                router.push("/checkout/confirmation");
              }}
            >
              {isSubmitting ? "Aanvraag versturen..." : "Bestelling afronden"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}

