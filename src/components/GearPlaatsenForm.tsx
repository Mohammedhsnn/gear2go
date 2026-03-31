"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function GearPlaatsenForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          description,
          location,
          imageUrl,
          pricePerDay: Number(pricePerDay),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Advertentie plaatsen mislukt.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Titel</label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bijv. Trek Fuel EX 9.8"
          required
          minLength={3}
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Subtitel</label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Mountainbike / Trail"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Adres</label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Bijv. Coolsingel 12, Rotterdam"
          required
          minLength={6}
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Prijs per dag (EUR)</label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          value={pricePerDay}
          onChange={(e) => setPricePerDay(e.target.value)}
          placeholder="45"
          type="number"
          step="0.01"
          min="0.01"
          required
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Afbeelding URL</label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Beschrijving</label>
        <textarea
          className="w-full bg-surface-container-high px-4 py-4 min-h-36"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschrijf staat, maat, accessoires..."
        />
      </div>

      {error ? <p className="md:col-span-2 text-sm text-error">{error}</p> : null}

      <button
        className="md:col-span-2 bg-primary text-on-primary py-5 font-bold uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all disabled:opacity-50"
        disabled={loading}
        type="submit"
      >
        {loading ? "PLAATSEN..." : "ADVERTENTIE PLAATSEN"}
      </button>
    </form>
  );
}
