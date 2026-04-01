"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function GlobalNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401 && !cancelled) {
            setVisible(false);
          }
          return;
        }

        const data = (await res.json().catch(() => ({}))) as {
          unreadCount?: number;
        };

        if (!cancelled) {
          setUnreadCount(data.unreadCount ?? 0);
          setVisible(true);
        }
      } catch {
        // Keep silent; this is a best-effort global indicator.
      }
    }

    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/notifications"
      className="fixed right-4 md:right-6 top-20 md:top-24 z-[80] bg-surface-container-high border border-outline-variant/30 w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:bg-surface-container-highest transition-colors"
      aria-label="Meldingen"
    >
      <span className="material-symbols-outlined text-on-surface">notifications</span>
      {unreadCount > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
