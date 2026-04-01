"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type LocationSuggestion = {
  label: string;
  lat: number;
  lng: number;
};

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homePoint, setHomePoint] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  useEffect(() => {
    const q = homeAddress.trim();
    if (q.length < 2) {
      setLocationSuggestions([]);
      setLocationLoading(false);
      return;
    }

    const ctrl = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLocationLoading(true);
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data = (await res.json().catch(() => ({}))) as {
          suggestions?: LocationSuggestion[];
        };
        setLocationSuggestions(data.suggestions ?? []);
      } finally {
        setLocationLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      ctrl.abort();
    };
  }, [homeAddress]);

  function selectHomeSuggestion(suggestion: LocationSuggestion) {
    setHomeAddress(suggestion.label);
    setHomePoint({ lat: suggestion.lat, lng: suggestion.lng });
    setLocationSuggestions([]);
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setVerificationUrl(null);

        if (password !== confirmPassword) {
          setError("Wachtwoorden komen niet overeen.");
          return;
        }

        if (!homeAddress.trim() || !homePoint) {
          setError("Kies een geldige thuislocatie uit de suggesties.");
          return;
        }

        setLoading(true);
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              displayName: displayName.trim() || null,
              homeAddress: homeAddress.trim(),
              homeLat: homePoint?.lat ?? null,
              homeLng: homePoint?.lng ?? null,
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
            verificationUrl?: string | null;
          };
          if (!res.ok) {
            setError(data.error || "Registratie mislukt.");
            return;
          }

          setSuccess(data.message || "Controleer je e-mail en bevestig je account voordat je inlogt.");
          if (data.verificationUrl) {
            setVerificationUrl(data.verificationUrl);
          }
          setPassword("");
          setConfirmPassword("");
          const next = searchParams.get("next");
          const safeNext = next && next.startsWith("/") ? next : "/dashboard";
          router.prefetch(safeNext);
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-2">
        <label
          htmlFor="displayName"
          className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant"
        >
          Naam
        </label>
        <input
          id="displayName"
          className="w-full bg-surface-container-high border-none px-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-body"
          placeholder="Bijv. Alex Jansen"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          type="text"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
          E-mailadres
        </label>
        <input
          id="email"
          className="w-full bg-surface-container-high border-none px-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-body"
          placeholder="naam@voorbeeld.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="homeAddress"
          className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant"
        >
          Thuisadres
        </label>
        <input
          id="homeAddress"
          className="w-full bg-surface-container-high border-none px-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-body"
          placeholder="Bijv. Amsterdam, Nederland"
          value={homeAddress}
          onChange={(e) => {
            setHomeAddress(e.target.value);
            setHomePoint(null);
          }}
          type="text"
          required
        />
        {locationLoading ? <p className="text-xs text-on-surface-variant">Locatie zoeken...</p> : null}
        {locationSuggestions.length > 0 ? (
          <ul className="border border-outline-variant/30 bg-surface-container-low max-h-48 overflow-auto">
            {locationSuggestions.map((suggestion) => (
              <li key={`${suggestion.lat}-${suggestion.lng}-${suggestion.label}`}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-high"
                  onClick={() => selectHomeSuggestion(suggestion)}
                >
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {homeAddress.trim() && !homePoint ? (
          <p className="text-xs text-on-surface-variant">
            Kies een suggestie om je locatie te bevestigen.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
          Wachtwoord
        </label>
        <input
          id="password"
          className="w-full bg-surface-container-high border-none px-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-body"
          placeholder="Minimaal 8 tekens"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant"
        >
          Herhaal wachtwoord
        </label>
        <input
          id="confirmPassword"
          className="w-full bg-surface-container-high border-none px-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-body"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          minLength={8}
          required
        />
      </div>

      {error ? <p className="text-xs text-error">{error}</p> : null}
      {success ? <p className="text-xs text-primary font-semibold">{success}</p> : null}
      {verificationUrl ? (
        <div className="text-xs text-on-surface-variant bg-surface-container-high p-3 border border-outline-variant/30">
          <p className="font-semibold mb-1">Verificatielink (tijdelijk):</p>
          <a className="text-primary underline break-all" href={verificationUrl}>{verificationUrl}</a>
        </div>
      ) : null}

      <button
        className="w-full bg-primary text-on-primary py-5 font-bold uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100 active:scale-95 disabled:opacity-50"
        type="submit"
        disabled={loading}
      >
        {loading ? "ACCOUNT MAKEN..." : "REGISTREREN"}
      </button>

      <p className="text-sm text-on-surface-variant text-center">
        Heb je al een account?
        <Link href="/dashboard" className="text-primary font-bold underline ml-1 hover:text-on-surface-variant">
          Inloggen
        </Link>
      </p>
    </form>
  );
}

