"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { LocationPickerMap } from "@/components/LocationPickerMap";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

type GearPlaatsenFormProps = {
  categories: Array<{ id: string; label: string }>;
};

type LocationSuggestion = {
  label: string;
  lat: number;
  lng: number;
};

export function GearPlaatsenForm({ categories }: GearPlaatsenFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pickedImageName, setPickedImageName] = useState<string | null>(null);
  const [pickedPoint, setPickedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [pricePerDay, setPricePerDay] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = location.trim();
    if (q.length < 2) {
      setLocationSuggestions([]);
      setLocationLoading(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLocationLoading(true);
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json().catch(() => ({}))) as {
          suggestions?: LocationSuggestion[];
        };

        setLocationSuggestions(data.suggestions ?? []);
      } finally {
        setLocationLoading(false);
      }
    }, 220);

    return () => clearTimeout(timeout);
  }, [location]);

  async function onImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPickedImageName(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Kies een geldig afbeeldingsbestand.");
      e.target.value = "";
      setPickedImageName(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Afbeelding mag maximaal 2MB zijn.");
      e.target.value = "";
      setPickedImageName(null);
      return;
    }

    setError(null);
    setPickedImageName(file.name);
    const dataUrl = await fileToDataUrl(file);
    setImageUrl(dataUrl);
  }

  function clearPickedImage() {
    setImageUrl("");
    setPickedImageName(null);
    setError(null);
  }

  function onPickMapLocation(point: { lat: number; lng: number }) {
    setPickedPoint(point);
    setLocation(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
    setLocationSuggestions([]);
  }

  function onSelectSuggestion(suggestion: LocationSuggestion) {
    setLocation(suggestion.label);
    setPickedPoint({ lat: suggestion.lat, lng: suggestion.lng });
    setLocationSuggestions([]);
  }

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
          categoryId,
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
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          Titel
        </label>
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
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          Subtitel
        </label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Mountainbike / Trail"
        />
      </div>

      <div className="md:col-span-2 bg-surface-container-high p-4 border border-outline-variant/30">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          Categorie (verplicht)
        </label>
        <select
          className="w-full bg-surface px-4 py-4"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="" disabled>
            Kies een categorie
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          Adres
        </label>
        <input
          className="w-full bg-surface-container-high px-4 py-4"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Bijv. Coolsingel 12, Rotterdam"
          required
          minLength={6}
        />
        {locationLoading ? (
          <p className="mt-2 text-xs text-on-surface-variant">Locaties zoeken...</p>
        ) : null}
        {locationSuggestions.length > 0 ? (
          <div className="mt-2 bg-surface-container-high border border-outline-variant/30 max-h-56 overflow-auto">
            {locationSuggestions.map((suggestion) => (
              <button
                key={`${suggestion.lat}-${suggestion.lng}-${suggestion.label}`}
                type="button"
                className="w-full text-left px-4 py-3 text-sm hover:bg-surface-container-highest transition-colors"
                onClick={() => onSelectSuggestion(suggestion)}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          Prijs per dag (EUR)
        </label>
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
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          Live map locatie
        </label>
        <LocationPickerMap selected={pickedPoint} onPick={onPickMapLocation} />
        <p className="mt-2 text-xs text-on-surface-variant">
          Klik op de kaart om je verhuurlocatie te kiezen.
        </p>
      </div>

      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          Afbeelding kiezen
        </label>
        <input
          className="w-full bg-surface-container-high px-4 py-4 file:mr-4 file:border-0 file:bg-primary file:text-on-primary file:px-4 file:py-2 file:font-bold file:uppercase file:tracking-wide file:cursor-pointer"
          type="file"
          accept="image/*"
          onChange={onImageFileChange}
        />
        <p className="mt-2 text-xs text-on-surface-variant">Kies een JPG, PNG of WEBP tot 2MB.</p>
        <p className="mt-1 text-xs text-on-surface-variant">Of plak hieronder een afbeelding URL.</p>
      </div>

      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          Afbeelding URL (optioneel)
        </label>
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
          <img
            src={imageUrl}
            alt="Gekozen advertentie-afbeelding"
            className="w-full max-h-80 object-cover bg-surface-container"
          />
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-xs text-on-surface-variant truncate">
              {pickedImageName ?? "Afbeelding via URL"}
            </p>
            <button
              type="button"
              onClick={clearPickedImage}
              className="text-xs font-bold uppercase tracking-wider text-primary hover:text-on-surface"
            >
              Verwijder afbeelding
            </button>
          </div>
        </div>
      ) : null}

      <div className="md:col-span-2">
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
          Beschrijving
        </label>
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Afbeelding kon niet worden gelezen."));
    reader.readAsDataURL(file);
  });
}
