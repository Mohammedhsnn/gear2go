"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  ownerName: string;
  productTitle: string;
  itemId: string;
};

type Message = {
  id: string;
  text: string;
  createdAt: string;
  readAt: string | null;
  author: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

type Conversation = {
  id: string;
  userOne: { id: string; displayName: string | null };
  userTwo: { id: string; displayName: string | null };
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

export default function BerichtenClient({
  ownerName,
  productTitle,
  itemId,
}: Props) {
  const [currentUser, setCurrentUser] = useState<{ id: string; displayName: string | null } | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSending, setMessageSending] = useState(false);
  const [requestSending, setRequestSending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Get current user and load conversations
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          window.location.href = "/register";
          return;
        }
        const user = await res.json();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to get current user:", error);
        window.location.href = "/register";
      }
    };

    loadUser();
  }, []);

  // Load or create conversation once we have current user
  useEffect(() => {
    if (!currentUser || !itemId) return;

    const loadConversation = async () => {
      try {
        // Fetch the item to get the owner's ID
        const itemRes = await fetch(`/api/items/${itemId}`);
        if (!itemRes.ok) {
          setMessageError("Item niet gevonden.");
          setLoading(false);
          return;
        }

        const item = await itemRes.json() as { id: string; owner: { id: string; displayName: string | null; avatarUrl: string | null } };
        const otherUserId = item.owner.id;

        // Don't allow conversation with self
        if (otherUserId === currentUser.id) {
          setMessageError("Je kunt geen gesprek met jezelf starten.");
          setLoading(false);
          return;
        }

        // Create or get conversation
        const convRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            otherUserId,
            itemId,
          }),
        });

        if (!convRes.ok) {
          setMessageError("Kon gesprek niet laden. Probeer opnieuw.");
          setLoading(false);
          return;
        }

        const conv = await convRes.json() as Conversation;
        setConversation(conv);

        // Load messages for this conversation
        const messagesRes = await fetch(`/api/messages?conversationId=${conv.id}`);
        if (messagesRes.ok) {
          const msgs = await messagesRes.json() as Message[];
          setMessages(msgs);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to load conversation:", error);
        setMessageError("Kon gesprek niet laden. Probeer opnieuw.");
        setLoading(false);
      }
    };

    loadConversation();
  }, [currentUser, itemId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || messageSending || !conversation) return;

    setMessageSending(true);
    setMessageError(null);

    try {
      // Moderate message
      const moderationRes = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!moderationRes.ok) {
        setMessageError("Moderatie tijdelijk niet beschikbaar. Probeer opnieuw.");
        return;
      }

      const moderation = await moderationRes.json() as {
        blocked: boolean;
        text: string;
      };

      if (moderation.blocked) {
        setInput(moderation.text);
        setMessageError("Bericht geblokkeerd: ongepaste taal is niet toegestaan.");
        return;
      }

      // Send message
      const messageRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          text: moderation.text,
        }),
      });

      if (!messageRes.ok) {
        setMessageError("Bericht kon niet verzonden worden.");
        return;
      }

      const newMessage = await messageRes.json() as Message;
      setMessages((prev) => [...prev, newMessage]);
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageError("Fout bij verzenden. Probeer opnieuw.");
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

    try {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + 3);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          startDateISO: start.toISOString().slice(0, 10),
          endDateISO: end.toISOString().slice(0, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Onbekende fout" })) as { error?: string };
        setRequestError(data?.error || "Huuraanvraag versturen is niet gelukt.");
        setRequestSending(false);
        return;
      }

      setRequestSending(false);
    } catch (error) {
      console.error("Failed to send rental request:", error);
      setRequestError("Fout bij verzenden huuraanvraag.");
      setRequestSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4">
        <span className="text-on-surface-variant">Je moet ingelogd zijn om te chatten.</span>
        <Link href="/register" className="bg-primary text-on-primary px-6 py-3 font-label text-xs uppercase tracking-widest">
          Inloggen
        </Link>
      </div>
    );
  }

  if (!itemId) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4">
        <span className="text-on-surface-variant">Geen gesprek geselecteerd. Open een chat via een product.</span>
        <Link href="/ontdekken" className="bg-primary text-on-primary px-6 py-3 font-label text-xs uppercase tracking-widest">
          Terug naar producten
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-on-surface-variant">Laden...</span>
      </div>
    );
  }

  if (messageError && !conversation) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4">
        <span className="text-on-surface-variant">{messageError}</span>
        <Link href="/ontdekken" className="bg-primary text-on-primary px-6 py-3 font-label text-xs uppercase tracking-widest">
          Terug naar producten
        </Link>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4">
        <span className="text-on-surface-variant">Gesprek laden...</span>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen overflow-y-scroll">
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
                      <h4 className="font-headline font-bold text-sm truncate uppercase tracking-tight">
                        {ownerName}
                      </h4>
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

              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-on-surface-variant text-sm">
                    Begin een gesprek
                  </span>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.author.id === currentUser?.id;
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
                })
              )}
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
