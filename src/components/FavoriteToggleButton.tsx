"use client";

import { useEffect, useState } from "react";

type FavoriteToggleButtonProps = {
  itemId: string;
  className?: string;
};

export function FavoriteToggleButton({ itemId, className = "" }: FavoriteToggleButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      const res = await fetch(`/api/favorites?itemId=${encodeURIComponent(itemId)}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { isFavorite?: boolean };
      if (!cancelled) {
        setIsFavorite(Boolean(data.isFavorite));
        setLoading(false);
      }
    }

    loadState().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  async function toggleFavorite() {
    if (busy) return;
    setBusy(true);

    const method = isFavorite ? "DELETE" : "POST";
    const res = await fetch("/api/favorites", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });

    if (res.status === 401) {
      window.location.href = `/register?next=${encodeURIComponent(`/products/${itemId}`)}`;
      return;
    }

    if (res.ok) {
      setIsFavorite(!isFavorite);
    }

    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading || busy}
      className={`material-symbols-outlined ${isFavorite ? "text-primary" : "text-on-surface-variant"} ${className}`}
      style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
      aria-label={isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
      title={isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
    >
      favorite
    </button>
  );
}
