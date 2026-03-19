"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function DashboardLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) {
            setError(data.error || "Inloggen mislukt.");
            return;
          }
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-2">
        <label
          className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant"
          htmlFor="email"
        >
          E-mailadres
        </label>
        <input
          id="email"
          className="w-full bg-surface-container-high border-none px-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-body"
          placeholder="naam@voorbeeld.nl"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label
            className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant"
            htmlFor="password"
          >
            Wachtwoord
          </label>
          <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant underline">
            Vergeten?
          </span>
        </div>
        <input
          id="password"
          className="w-full bg-surface-container-high border-none px-4 py-4 focus:ring-2 focus:ring-primary text-on-surface font-body"
          placeholder="••••••••"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error ? <p className="text-xs text-error">{error}</p> : null}

      <button
        className="w-full bg-primary text-on-primary py-5 font-bold uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100 active:scale-95 disabled:opacity-50"
        type="submit"
        disabled={loading}
      >
        {loading ? "INLOGGEN..." : "INLOGGEN"}
      </button>

      <p className="text-sm text-on-surface-variant text-center">
        Nog geen account?
        <Link href="/register" className="text-primary font-bold underline ml-1 hover:text-on-surface-variant">
          Registreer hier
        </Link>
      </p>
    </form>
  );
}

