"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export function DashboardLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  const verifyMessage =
    verified === "ok"
      ? "E-mailadres bevestigd. Je kunt nu inloggen."
      : verified === "expired"
        ? "Verificatielink is verlopen. Maak een nieuw account aan of vraag een nieuwe link aan."
        : verified === "invalid" || verified === "missing"
          ? "Ongeldige verificatielink."
          : null;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResendError(null);
        setResendInfo(null);
        setVerificationUrl(null);
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            code?: string;
            retryAfterSeconds?: number;
          };
          if (!res.ok) {
            setError(data.error || "Inloggen mislukt.");
            if (data.code === "EMAIL_NOT_VERIFIED") {
              setUnverifiedEmail(email.trim().toLowerCase());
            } else {
              setUnverifiedEmail(null);
            }
            return;
          }
          setUnverifiedEmail(null);
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
      {verifyMessage ? <p className="text-xs text-primary font-semibold">{verifyMessage}</p> : null}
      {resendInfo ? <p className="text-xs text-primary font-semibold">{resendInfo}</p> : null}
      {resendError ? <p className="text-xs text-error">{resendError}</p> : null}
      {verificationUrl ? (
        <p className="text-xs text-on-surface-variant">
          Dev verificatielink: <a className="text-primary underline" href={verificationUrl}>{verificationUrl}</a>
        </p>
      ) : null}

      {unverifiedEmail ? (
        <button
          className="w-full border border-primary text-primary py-4 font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all duration-100 disabled:opacity-50"
          type="button"
          disabled={resendLoading || resendCooldown > 0}
          onClick={async () => {
            if (!unverifiedEmail) return;
            setResendLoading(true);
            setResendError(null);
            setResendInfo(null);
            setVerificationUrl(null);
            try {
              const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: unverifiedEmail }),
              });

              const data = (await res.json().catch(() => ({}))) as {
                error?: string;
                message?: string;
                retryAfterSeconds?: number;
                verificationUrl?: string | null;
              };

              if (!res.ok) {
                if (res.status === 429) {
                  const retry = Math.max(1, data.retryAfterSeconds ?? 60);
                  setResendCooldown(retry);
                }
                setResendError(data.error || "Kon verificatiemail niet opnieuw versturen.");
                return;
              }

              setResendInfo(data.message || "Verificatiemail opnieuw verstuurd.");
              if (data.verificationUrl) {
                setVerificationUrl(data.verificationUrl);
              }
              setResendCooldown(60);
            } finally {
              setResendLoading(false);
            }
          }}
        >
          {resendLoading
            ? "VERZENDEN..."
            : resendCooldown > 0
              ? `OPNIEUW STUREN OVER ${resendCooldown}S`
              : "VERIFICATIEMAIL OPNIEUW STUREN"}
        </button>
      ) : null}

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

