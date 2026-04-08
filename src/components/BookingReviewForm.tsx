"use client";

import { useMemo, useState } from "react";

type ReviewDirection = "RENTER_TO_OWNER" | "OWNER_TO_RENTER";

type BookingReviewFormProps = {
  bookingId: string;
  direction: ReviewDirection;
  disabled?: boolean;
  onSubmitted?: () => void;
};

function StarPicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-2">{label}</p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const filled = starValue <= value;
          return (
            <button
              key={`${label}-${starValue}`}
              type="button"
              disabled={disabled}
              onClick={() => onChange(starValue)}
              className={`material-symbols-outlined text-2xl leading-none disabled:opacity-50 ${
                filled ? "text-primary" : "text-outline"
              }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-label={`${label}: ${starValue} sterren`}
            >
              star
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BookingReviewForm({ bookingId, direction, disabled = false, onSubmitted }: BookingReviewFormProps) {
  const [firstRating, setFirstRating] = useState(0);
  const [secondRating, setSecondRating] = useState(0);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const labels = useMemo(() => {
    if (direction === "RENTER_TO_OWNER") {
      return {
        title: "Review: huurder naar verhuurder",
        first: "Materiaal als beschreven",
        second: "Communicatie",
      };
    }

    return {
      title: "Review: verhuurder naar huurder",
      first: "Punctualiteit",
      second: "Zorgvuldigheid",
    };
  }, [direction]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (firstRating < 1 || secondRating < 1) {
      setError("Geef voor beide onderdelen een score van 1 t/m 5.");
      return;
    }
    if (text.trim().length < 10) {
      setError("Motivatie moet minimaal 10 tekens zijn.");
      return;
    }

    setSaving(true);
    try {
      const payload =
        direction === "RENTER_TO_OWNER"
          ? {
              bookingId,
              direction,
              materialAsDescribedRating: firstRating,
              communicationRating: secondRating,
              text: text.trim(),
            }
          : {
              bookingId,
              direction,
              punctualityRating: firstRating,
              carefulnessRating: secondRating,
              text: text.trim(),
            };

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Review opslaan mislukt.");
        return;
      }

      setSuccess(true);
      onSubmitted?.();
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="mt-4 border border-primary/30 bg-surface-container-low p-4">
        <p className="text-xs uppercase tracking-widest text-primary font-bold">Review opgeslagen</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 border border-outline-variant/20 bg-surface-container-low p-4 space-y-4">
      <p className="text-[11px] uppercase tracking-widest font-bold text-on-surface">{labels.title}</p>

      <StarPicker label={labels.first} value={firstRating} onChange={setFirstRating} disabled={disabled || saving} />
      <StarPicker label={labels.second} value={secondRating} onChange={setSecondRating} disabled={disabled || saving} />

      <div>
        <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-2">Korte motivatie</p>
        <textarea
          className="w-full min-h-20 bg-surface px-3 py-2 text-sm"
          minLength={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || saving}
          placeholder="Minimaal 10 tekens"
        />
      </div>

      {error ? <p className="text-xs text-error">{error}</p> : null}

      <button
        type="submit"
        disabled={disabled || saving}
        className="bg-primary text-on-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
      >
        {saving ? "OPSLAAN..." : "PLAATS REVIEW"}
      </button>
    </form>
  );
}
