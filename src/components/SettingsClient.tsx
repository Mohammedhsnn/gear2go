"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UserSettings = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export default function SettingsClient() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) {
          window.location.href = "/dashboard";
          return;
        }
        const data = (await res.json()) as UserSettings;
        setSettings(data);
        setDisplayName(data.displayName || "");
        setAvatarUrl(data.avatarUrl || "");
        setLoading(false);
      } catch (err) {
        console.error("Fout bij laden instellingen:", err);
        setError("Kon instellingen niet laden");
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Selecteer een afbeeldingsbestand");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Foto is te groot (max 5MB)");
      return;
    }

    setAvatarFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Naam is vereist");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body: any = {
        displayName: displayName.trim(),
      };

      // If there's a file, convert to base64
      if (avatarFile && avatarPreview) {
        body.avatarBase64 = avatarPreview;
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "Kon instellingen niet opslaan");
        return;
      }

      const updatedUser = (await res.json()) as UserSettings;
      setSettings(updatedUser);
      setAvatarUrl(updatedUser.avatarUrl || "");
      setAvatarFile(null);
      setAvatarPreview(null);
      setSuccess("Instellingen succesvol opgeslagen!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Fout bij opslaan:", err);
      setError("Fout bij opslaan instellingen");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-on-surface-variant">Laden...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4">
        <span className="text-on-surface-variant">Instellingen niet beschikbaar</span>
        <Link href="/dashboard" className="bg-primary text-on-primary px-6 py-3 font-label text-xs uppercase tracking-widest">
          Terug
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-primary mb-2">
          Instellingen
        </h1>
        <p className="text-on-surface-variant">
          Pas je accountgegevens aan
        </p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/20 p-8 space-y-6">
        {/* Email Info */}
        <div>
          <label className="block text-sm font-label uppercase tracking-widest text-on-surface-variant mb-2">
            Email (kan niet gewijzigd worden)
          </label>
          <input
            type="email"
            value={settings.email}
            disabled
            className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 text-on-surface font-body opacity-60 cursor-not-allowed"
          />
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-label uppercase tracking-widest text-on-surface-variant mb-2">
            Je Naam
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Bijv. Thomas V."
            className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/20 text-on-surface font-body placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="text-[11px] text-on-surface-variant mt-1 uppercase tracking-widest">Dit is de naam die anderen zien</p>
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-label uppercase tracking-widest text-on-surface-variant mb-2">
            Profielfoto
          </label>
          <div className="border-2 border-dashed border-outline-variant/40 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="avatar-input"
            />
            <label htmlFor="avatar-input" className="cursor-pointer block">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mx-auto mb-2">
                image
              </span>
              <p className="text-sm font-label uppercase tracking-widest text-on-surface-variant">
                Klik om foto te selecteren of sleep hier
              </p>
              <p className="text-[11px] text-on-surface-variant/60 mt-1">
                PNG, JPG, GIF (max 5MB)
              </p>
            </label>
          </div>
        </div>

        {/* URL Fallback */}
        <div>
          <label className="block text-sm font-label uppercase tracking-widest text-on-surface-variant mb-2">
            Of foto URL (optioneel)
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/20 text-on-surface font-body placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="text-[11px] text-on-surface-variant mt-1 uppercase tracking-widest">Direct link naar je profielfoto</p>
        </div>

        {/* Preview */}
        {(avatarPreview || avatarUrl) && (
          <div className="bg-surface-container-highest p-4 border border-outline-variant/20">
            <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-3">Voorbeeld</p>
            <img
              src={avatarPreview || avatarUrl}
              alt="Profielfoto preview"
              className="w-20 h-20 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b] px-4 py-3 text-xs font-semibold uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-[#dcfce7] border border-[#86efac] text-[#166534] px-4 py-3 text-xs font-semibold uppercase tracking-wider">
            {success}
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-primary text-on-primary px-6 py-3 font-headline font-bold uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100 disabled:opacity-60"
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
          <Link
            href="/dashboard"
            className="flex-1 border-2 border-primary text-primary px-6 py-3 font-headline font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all duration-100 text-center"
          >
            Annuleren
          </Link>
        </div>
      </div>
    </div>
  );
}
