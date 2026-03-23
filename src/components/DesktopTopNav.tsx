"use client";

import Link from "next/link";
import { useState } from "react";

type DesktopTopNavProps = {
  active?: "home" | "ontdekken" | "huren" | "verhuren" | "over";
};

export function DesktopTopNav({ active }: DesktopTopNavProps) {
  const [value, setValue] = useState("");

  const itemBase =
    "font-headline text-sm uppercase tracking-wider transition-colors";
  const itemActive = "text-primary font-bold border-b-2 border-primary pb-1";
  const itemInactive = "text-on-surface-variant hover:text-primary";

  return (
    <header className="bg-surface/80 backdrop-blur-md fixed top-0 z-50 hidden md:block w-full">
      <div className="h-20 flex items-center">
        <div className="w-full max-w-[1440px] mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link className="text-2xl font-black tracking-tighter text-primary" href="/">
              GEAR2GO
            </Link>
            <div className="hidden md:flex gap-6 items-center">
              <Link
                className={`${itemBase} ${active === "home" ? itemActive : itemInactive}`}
                href="/"
              >
                Home
              </Link>
              <Link
                className={`${itemBase} ${active === "ontdekken" ? itemActive : itemInactive}`}
                href="/ontdekken"
              >
                Ontdekken
              </Link>
              <Link
                className={`${itemBase} ${active === "huren" ? itemActive : itemInactive}`}
                href="/search"
              >
                Huren
              </Link>
              <Link className={itemBase + " " + itemInactive} href="/hoe-het-werkt">
                Hoe het werkt
              </Link>
              <Link className={itemBase + " " + itemInactive} href="/berichten">
                Berichten
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <input
                className="bg-surface-container-high border-none px-4 py-2 w-64 text-sm focus:ring-1 focus:ring-primary"
                placeholder="Zoek gear..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined cursor-pointer hover:bg-surface-container-highest p-2 transition-all">
                notifications
              </span>
              <span className="material-symbols-outlined cursor-pointer hover:bg-surface-container-highest p-2 transition-all">
                favorite
              </span>
              <Link
                className="material-symbols-outlined cursor-pointer hover:bg-surface-container-highest p-2 transition-all text-on-surface no-underline"
                href="/ontdekken"
              >
                chat_bubble
              </Link>
            </div>
            <Link className="w-10 h-10 bg-surface-container-high overflow-hidden" href="/dashboard">
              <div className="w-full h-full bg-surface-container-highest" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

