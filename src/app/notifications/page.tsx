"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  readAt: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/dashboard";
      return;
    }

    const data = (await res.json()) as { notifications?: Notification[] };
    setItems(data.notifications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  async function markAllRead() {
    setSaving(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    await load();
    setSaving(false);
  }

  return (
    <div className="bg-surface text-on-surface min-h-dvh flex flex-col">
      <nav className="fixed top-0 z-50 w-full flex justify-between items-center px-6 md:px-12 py-6 bg-surface bg-opacity-80 backdrop-blur-md">
        <Link className="text-3xl font-black tracking-tighter text-primary font-headline uppercase" href="/">
          GEAR2GO
        </Link>
        <div className="hidden md:flex items-center gap-12">
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/">
            HOME
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/ontdekken">
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
      </nav>

      <main className="pt-28 px-6 md:px-12 pb-20 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter text-primary">Meldingen</h1>
            <button
              type="button"
              className="border border-outline/60 px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-surface-container-high disabled:opacity-60"
              onClick={markAllRead}
              disabled={saving}
            >
              {saving ? "Bezig..." : "Alles gelezen"}
            </button>
          </div>

          {loading ? (
            <p className="text-on-surface-variant uppercase tracking-widest text-xs">Laden...</p>
          ) : items.length === 0 ? (
            <div className="bg-surface-container-low p-8 border border-outline-variant/20">
              <p className="text-on-surface-variant uppercase tracking-widest text-xs">Geen meldingen.</p>
              <Link href="/ontdekken" className="inline-block mt-4 underline">
                Naar ontdekken
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((n) => (
                <article
                  key={n.id}
                  className={`p-5 border ${n.readAt ? "bg-surface-container-low border-outline/40" : "bg-primary/10 border-outline/45"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold uppercase tracking-wide">{n.title}</h2>
                      {n.body ? <p className="text-sm text-on-surface-variant mt-1">{n.body}</p> : null}
                    </div>
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant">{formatDate(n.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-primary text-on-primary flex flex-col md:flex-row justify-between items-center px-12 py-12 w-full mt-auto">
        <div className="flex flex-col mb-8 md:mb-0">
          <div className="text-xl font-bold text-white font-headline mb-2 uppercase">GEAR2GO</div>
          <p className="font-headline text-[10px] tracking-[0.05em] uppercase text-[#c6c6c6]">© 2026 GEAR2GO. ALLE RECHTEN VOORBEHOUDEN.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {[
            ["OVER ONS", "/hoe-het-werkt"],
            ["VOORWAARDEN", "/"],
            ["PRIVACY", "/settings"],
            ["CONTACT", "/berichten"],
          ].map(([label, href]) => (
            <Link key={label} className="font-headline text-[10px] tracking-[0.05em] uppercase text-[#c6c6c6] hover:text-white transition-colors" href={href}>
              {label}
            </Link>
          ))}
        </div>
      </footer>

      <BottomNav active="profile" />
    </div>
  );
}
