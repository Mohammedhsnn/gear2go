"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  ownerName: string;
  productTitle: string;
  itemId: string;
};

type ChatMessage = {
  id: string;
  sender: "me" | "other" | "system";
  text: string;
  createdAt: string;
  readAt?: string;
};

function formatClock(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function isoTodayLabel(): string {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })
    .format(new Date())
    .toUpperCase();
}

function nextRentalWindow(): { startDateISO: string; endDateISO: string } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return { startDateISO: toISODate(start), endDateISO: toISODate(end) };
}

export default function BerichtenClient({
  ownerName,
  productTitle,
  itemId,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      sender: "other",
      text: `Hi! Ik ben ${ownerName}. Vragen over ${productTitle}?`,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [requestSending, setRequestSending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSending, setMessageSending] = useState(false);

  const latestMine = useMemo(
    () => [...messages].reverse().find((m) => m.sender === "me") ?? null,
    [messages],
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || messageSending) return;

    setMessageSending(true);
    setMessageError(null);

    try {
      const moderationRes = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!moderationRes.ok) {
        setMessageError("Moderatie tijdelijk niet beschikbaar. Probeer opnieuw.");
        return;
      }

      const moderation = (await moderationRes.json()) as {
        blocked: boolean;
        text: string;
      };

      if (moderation.blocked) {
        setInput(moderation.text);
        setMessageError("Bericht geblokkeerd: ongepaste taal is niet toegestaan.");
        return;
      }

      const cleanText = moderation.text;
      const now = new Date().toISOString();
      setInput("");

      const myId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: myId, sender: "me", text: cleanText, createdAt: now },
      ]);

      setOtherTyping(true);
      setTimeout(() => {
        setOtherTyping(false);
        const replyText =
          "Top, ik heb je bericht gezien. Als je wilt, kun je direct hieronder een huuraanvraag versturen.";
        const replyAt = new Date().toISOString();
        setMessages((prev) => {
          const withRead = prev.map((m) =>
            m.id === myId ? { ...m, readAt: replyAt } : m,
          );
          return [
            ...withRead,
            {
              id: crypto.randomUUID(),
              sender: "other",
              text: replyText,
              createdAt: replyAt,
            },
          ];
        });
      }, 1300);
    } catch {
      setMessageError("Moderatie tijdelijk niet beschikbaar. Probeer opnieuw.");
    } finally {
      setMessageSending(false);
    }
  };

  const sendRentalRequest = async () => {
    setRequestError(null);
    if (!itemId) {
      setRequestError("Geen itemId gevonden. Open chat via checkout of productdetail.");
      return;
    }
    setRequestSending(true);

    const { startDateISO, endDateISO } = nextRentalWindow();
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, startDateISO, endDateISO }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setRequestError(data?.error || "Huuraanvraag versturen is niet gelukt.");
      setRequestSending(false);
      return;
    }

    const payload = (await res.json()) as { booking: { id: string; status: string } };
    const when = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: "system",
        text: `Huuraanvraag verzonden. Status: ${payload.booking.status}.`,
        createdAt: when,
      },
    ]);
    setRequestSending(false);
  };

  return (
    <div className="bg-surface text-on-surface overflow-hidden min-h-screen">
      <nav className="fixed top-0 z-50 w-full flex justify-between items-center px-6 md:px-12 py-6 bg-surface bg-opacity-80 backdrop-blur-md">
        <Link href="/" className="text-3xl font-black tracking-tighter text-primary font-headline uppercase">
          GEAR2GO
        </Link>
        <div className="hidden md:flex items-center gap-12">
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/">
            HOME
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/ontdekken">
            ONTDEKKEN
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/hoe-het-werkt">
            HOE HET WERKT
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-primary border-b-4 border-primary pb-1" href="/berichten">
            BERICHTEN
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link className="font-headline tracking-tight uppercase text-sm font-bold bg-primary text-on-primary px-6 py-3 hover:bg-surface-dim hover:text-primary transition-colors duration-100 hidden md:inline-flex" href="/gearplaatsen">
            GEAR PLAATSEN
          </Link>
          <Link href="/cart" className="material-symbols-outlined text-3xl cursor-pointer">
            shopping_basket
          </Link>
          <Link href="/dashboard" className="material-symbols-outlined text-3xl cursor-pointer">
            account_circle
          </Link>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-96px)] overflow-hidden pt-24">
        <aside className="bg-surface-container-low w-64 flex-col h-full py-8 hidden lg:flex">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm tracking-tight">MARK J.</h3>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-label">Verified Renter</p>
            </div>
          </div>
          <nav className="flex-grow">
            <div className="bg-primary text-on-primary flex items-center gap-4 px-6 py-4 w-full">
              <span className="material-symbols-outlined">mail</span>
              <span className="font-label text-xs uppercase tracking-widest">Berichten</span>
            </div>
          </nav>
        </aside>

        <main className="flex flex-1 overflow-hidden bg-background">
          <section className="w-full md:w-80 lg:w-96 bg-surface-container-low flex flex-col">
            <div className="p-6">
              <h1 className="text-3xl font-headline font-black uppercase tracking-tight mb-6">Berichten</h1>
            </div>
            <div className="flex-grow overflow-y-auto">
              <div className="bg-surface-container-lowest p-6 border-l-4 border-primary cursor-pointer">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h4 className="font-headline font-bold text-sm truncate uppercase tracking-tight">{ownerName}</h4>
                      <span className="text-[10px] text-on-surface-variant font-label">
                        {messages.length ? formatClock(messages[messages.length - 1]!.createdAt) : "--:--"}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface truncate font-medium">Bericht over: {productTitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col flex-grow bg-surface">
            <header className="bg-surface-container-low p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <h2 className="font-headline font-black text-xl uppercase tracking-tight">{ownerName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-xs text-primary">calendar_today</span>
                    <p className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant">
                      Chat over: <span className="text-primary font-bold">{productTitle}</span>
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={sendRentalRequest}
                disabled={requestSending}
                className="bg-primary text-on-primary px-6 py-3 font-label text-[11px] uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100 disabled:opacity-60"
              >
                {requestSending ? "Aanvraag..." : "Direct Huuraanvraag"}
              </button>
            </header>

            <div className="flex-grow p-8 overflow-y-auto flex flex-col gap-6 bg-surface-bright">
              <div className="flex justify-center">
                <span className="bg-surface-container-low px-4 py-1 text-[9px] font-label uppercase tracking-[0.2em] text-on-surface-variant">
                  {isoTodayLabel()}
                </span>
              </div>

              {messages.map((m) => {
                if (m.sender === "system") {
                  return (
                    <div key={m.id} className="flex justify-center">
                      <span className="bg-primary text-on-primary px-3 py-2 text-[10px] uppercase tracking-widest font-bold">
                        {m.text} - {formatClock(m.createdAt)}
                      </span>
                    </div>
                  );
                }

                const isMine = m.sender === "me";
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 max-w-[82%] ${isMine ? "self-end flex-row-reverse text-right" : ""}`}
                  >
                    {!isMine ? (
                      <div className="w-8 h-8 bg-surface-container-high flex items-center justify-center mt-1">
                        <span className="material-symbols-outlined text-sm">person</span>
                      </div>
                    ) : null}
                    <div>
                      <div className={isMine ? "bg-primary p-4 text-sm leading-relaxed text-on-primary" : "bg-surface-container-high p-4 text-sm leading-relaxed text-on-surface"}>
                        {m.text}
                      </div>
                      <span className="text-[10px] font-label text-on-surface-variant mt-2 inline-block">
                        {formatClock(m.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {otherTyping ? (
                <div className="text-xs uppercase tracking-widest text-on-surface-variant font-label">
                  {ownerName} typt...
                </div>
              ) : null}
            </div>

            <footer className="p-6 bg-surface-container-low border-t border-outline-variant/20">
              {messageError ? (
                <div className="mb-3 bg-[#fee2e2] text-[#991b1b] px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                  {messageError}
                </div>
              ) : null}
              {requestError ? (
                <div className="mb-3 bg-[#fee2e2] text-[#991b1b] px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                  {requestError}
                </div>
              ) : null}
              {latestMine ? (
                <div className="mb-3 text-[10px] uppercase tracking-widest text-on-surface-variant font-label text-right">
                  {latestMine.readAt
                    ? `Gelezen ${formatClock(latestMine.readAt)}`
                    : "Verzonden"}
                </div>
              ) : null}
              <div className="bg-surface-container-lowest p-2 flex items-end gap-2 border border-outline-variant/20">
                <div className="flex flex-col flex-grow">
                  <textarea
                    className="w-full bg-transparent border-none focus:ring-0 p-4 text-sm resize-none font-body"
                    placeholder="TYP EEN BERICHT..."
                    rows={1}
                    style={{ minHeight: 56 }}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (messageError) setMessageError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={messageSending}
                  className="bg-primary text-on-primary px-8 py-3 font-label text-xs uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100 disabled:opacity-60"
                >
                  {messageSending ? "Controleren..." : "Verstuur"}
                </button>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}
