"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createDefaultLine, useCart } from "@/state/cart";

function isoToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type AddToCartButtonProps = {
  productId: string;
  className?: string;
  label?: string;
};

export function AddToCartButton({
  productId,
  className,
  label = "DIRECT HUREN",
}: AddToCartButtonProps) {
  const router = useRouter();
  const { addOrUpdateLine } = useCart();
  const defaults = useMemo(() => createDefaultLine(productId), [productId]);
  const [open, setOpen] = useState(false);
  const [startDateISO, setStartDateISO] = useState(defaults.startDateISO || isoToday());
  const [endDateISO, setEndDateISO] = useState(defaults.endDateISO || isoToday());
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        className={
          className ||
          "bg-primary text-on-primary py-4 font-label text-xs tracking-widest uppercase hover:bg-surface-dim hover:text-primary transition-colors duration-100"
        }
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] bg-black/40 p-4 flex items-end md:items-center justify-center">
          <div className="w-full max-w-md bg-surface p-6 shadow-ambient">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline text-2xl font-black uppercase tracking-tight">
                Kies je huurdata
              </h3>
              <button
                type="button"
                className="material-symbols-outlined text-on-surface-variant hover:text-primary"
                onClick={() => setOpen(false)}
                aria-label="Sluiten"
              >
                close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">
                  Startdatum
                </label>
                <input
                  type="date"
                  className="w-full bg-surface-container-high border-none px-4 py-3"
                  value={startDateISO}
                  onChange={(e) => setStartDateISO(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">
                  Einddatum
                </label>
                <input
                  type="date"
                  className="w-full bg-surface-container-high border-none px-4 py-3"
                  value={endDateISO}
                  onChange={(e) => setEndDateISO(e.target.value)}
                />
              </div>
              {error ? <p className="text-xs text-error">{error}</p> : null}
            </div>

            <button
              type="button"
              className="mt-6 w-full bg-primary text-on-primary py-4 font-black uppercase tracking-[0.15em] hover:bg-surface-dim hover:text-primary transition-colors"
              onClick={() => {
                if (!startDateISO || !endDateISO) {
                  setError("Kies zowel start- als einddatum.");
                  return;
                }
                if (startDateISO > endDateISO) {
                  setError("Einddatum moet op of na startdatum liggen.");
                  return;
                }
                addOrUpdateLine({
                  productId,
                  quantity: 1,
                  startDateISO,
                  endDateISO,
                });
                setOpen(false);
                router.push("/cart");
              }}
            >
              Toevoegen aan winkelwagen
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

