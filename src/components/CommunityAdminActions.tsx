"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ItemStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "ARCHIVED";

type CommunityAdminActionsProps = {
  itemId: string;
  status: ItemStatus;
};

const STATUS_OPTIONS: Array<{ value: ItemStatus; label: string }> = [
  { value: "DRAFT", label: "Concept" },
  { value: "PUBLISHED", label: "Beschikbaar" },
  { value: "PAUSED", label: "Gepauzeerd" },
  { value: "ARCHIVED", label: "Gearchiveerd" },
];

export function CommunityAdminActions({ itemId, status }: CommunityAdminActionsProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSaveStatus() {
    if (selectedStatus === status) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Status wijzigen mislukt.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm("Weet je zeker dat je deze listing wilt verwijderen?");
    if (!confirmed) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Listing verwijderen mislukt.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border border-outline-variant/30 bg-surface-container p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Admin opties</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="bg-surface-container-high px-2 py-2 text-xs uppercase tracking-wider"
          disabled={busy}
          onChange={(e) => setSelectedStatus(e.target.value as ItemStatus)}
          value={selectedStatus}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          className="border border-primary text-primary px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50"
          disabled={busy || selectedStatus === status}
          onClick={onSaveStatus}
          type="button"
        >
          {busy ? "BEZIG..." : "STATUS OPSLAAN"}
        </button>
        <a
          className="border border-primary text-primary px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors"
          href={`/dashboard/items/${encodeURIComponent(itemId)}`}
        >
          BEWERKEN
        </a>
        <button
          className="border border-error text-error px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-error hover:text-on-primary transition-colors disabled:opacity-50"
          disabled={busy}
          onClick={onDelete}
          type="button"
        >
          VERWIJDER
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}
