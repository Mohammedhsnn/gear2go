"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

type DashboardItemEditFormProps = {
  item: {
    id: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    location: string | null;
    imageUrl: string | null;
    pricePerDayCents: number;
  };
};

export function DashboardItemEditForm({ item }: DashboardItemEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [subtitle, setSubtitle] = useState(item.subtitle ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [location, setLocation] = useState(item.location ?? "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [pickedImageName, setPickedImageName] = useState<string | null>(null);
  const [pricePerDay, setPricePerDay] = useState((item.pricePerDayCents / 100).toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPickedImageName(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Kies een geldig afbeeldingsbestand.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Afbeelding mag maximaal 2MB zijn.");
      e.target.value = "";
      return;
    }

    setError(null);
    setPickedImageName(file.name);
    const dataUrl = await fileToDataUrl(file);
    setImageUrl(dataUrl);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
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
        setError(data.error || "Opslaan mislukt.");
        return;
      }

      setSaved(true);
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
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Locatie</label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Prijs per dag (EUR)</label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={pricePerDay}
          onChange={(e) => setPricePerDay(e.target.value)}
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Afbeelding kiezen</label>
        <input
          className="w-full bg-surface-container-high px-4 py-4 file:mr-4 file:border-0 file:bg-primary file:text-on-primary file:px-4 file:py-2 file:font-bold file:uppercase file:tracking-wide file:cursor-pointer"
          type="file"
          accept="image/*"
          onChange={onImageFileChange}
        />
        <p className="mt-2 text-xs text-on-surface-variant">Kies een JPG, PNG of WEBP tot 2MB.</p>
      </div>

      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Afbeelding URL (optioneel)</label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          value={imageUrl.startsWith("data:image/") ? "" : imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            if (e.target.value) {
              setPickedImageName(null);
            }
          }}
          placeholder="https://..."
        />
      </div>

      {imageUrl ? (
        <div className="md:col-span-2 bg-surface-container-high p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">Preview</p>
          <img src={imageUrl} alt="Gekozen advertentie-afbeelding" className="w-full max-h-80 object-cover bg-surface-container" />
          <p className="mt-3 text-xs text-on-surface-variant truncate">{pickedImageName ?? "Afbeelding via URL"}</p>
        </div>
      ) : null}

      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Beschrijving</label>
        <textarea
          className="w-full bg-surface-container-high px-4 py-4 min-h-36"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error ? <p className="md:col-span-2 text-sm text-error">{error}</p> : null}
      {saved ? <p className="md:col-span-2 text-sm text-primary">Opgeslagen.</p> : null}

      <button
        className="md:col-span-2 bg-primary text-on-primary py-5 font-bold uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all disabled:opacity-50"
        disabled={loading}
        type="submit"
      >
        {loading ? "OPSLAAN..." : "OPSLAAN"}
      </button>
    </form>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Afbeelding kon niet worden gelezen."));
    reader.readAsDataURL(file);
  });
}
