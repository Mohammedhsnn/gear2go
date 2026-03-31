"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  updatedAt: string;
  userOne: { id: string; displayName: string | null; avatarUrl?: string | null };
  userTwo: { id: string; displayName: string | null; avatarUrl?: string | null };
  item?: { id: string; title: string; imageUrl?: string | null } | null;
  messages?: Array<{ text: string; createdAt: string; authorId: string }>;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSending, setMessageSending] = useState(false);
  const [requestSending, setRequestSending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const selectedOtherUser = useMemo(() => {
    if (!selectedConversation || !currentUser) return null;
    return selectedConversation.userOne.id === currentUser.id
      ? selectedConversation.userTwo
      : selectedConversation.userOne;
  }, [selectedConversation, currentUser]);

  const selectedItemId = selectedConversation?.item?.id ?? itemId;
  const dmStarters = useMemo(() => {
    const itemTitle = selectedConversation?.item?.title || productTitle || "item";
    return [
      `Hey, ik wil je ${itemTitle} graag huren en zelf ophalen. Is deze nog beschikbaar?`,
      `Hoi! Ik ben geinteresseerd in je ${itemTitle}. Ik wil het graag ophalen, welke dag past voor jou?`,
      `Goedendag, ik wil je ${itemTitle} graag huren. Ik haal het op, wanneer komt dat jou uit?`,
    ];
  }, [selectedConversation?.item?.title, productTitle]);

  function getOtherUser(conv: Conversation) {
    if (!currentUser) return conv.userTwo;
    return conv.userOne.id === currentUser.id ? conv.userTwo : conv.userOne;
  }

  // Get current user and load conversations
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          window.location.href = "/register";
          return;
        }
        const payload = (await res.json()) as {
          user?: { id: string; displayName: string | null } | null;
        };
        if (!payload.user) {
          window.location.href = "/register";
          return;
        }
        setCurrentUser(payload.user);
      } catch (error) {
        console.error("Failed to get current user:", error);
        window.location.href = "/register";
      }
    };

    loadUser();
  }, []);

  // Load or create conversation once we have current user
  useEffect(() => {
    if (!currentUser) return;

    const loadConversation = async () => {
      try {
        const listRes = await fetch("/api/conversations", { cache: "no-store" });
        if (!listRes.ok) {
          setMessageError("Kon gesprekken niet laden.");
          setLoading(false);
          return;
        }

        let list = (await listRes.json()) as Conversation[];
        let preferredId: string | null = null;

        if (itemId) {
          const itemRes = await fetch(`/api/items/${itemId}`);
          if (itemRes.ok) {
            const item = (await itemRes.json()) as {
              id: string;
              owner: { id: string; displayName: string | null; avatarUrl: string | null };
            };
            const otherUserId = item.owner.id;

            if (otherUserId !== currentUser.id) {
              const convRes = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  otherUserId,
                  itemId,
                }),
              });

              if (convRes.ok) {
                const conv = (await convRes.json()) as Conversation;
                preferredId = conv.id;
                const exists = list.some((c) => c.id === conv.id);
                if (!exists) {
                  const refreshRes = await fetch("/api/conversations", { cache: "no-store" });
                  if (refreshRes.ok) {
                    list = (await refreshRes.json()) as Conversation[];
                  } else {
                    list = [conv, ...list];
                  }
                }
              }
            }
          }
        }

        setConversations(list);
        const firstId = list[0]?.id ?? null;
        setSelectedConversationId(preferredId ?? firstId);

        setLoading(false);
      } catch (error) {
        console.error("Failed to load conversation:", error);
        setMessageError("Kon gesprek niet laden. Probeer opnieuw.");
        setLoading(false);
      }
    };

    loadConversation();
  }, [currentUser, itemId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        const messagesRes = await fetch(`/api/messages?conversationId=${selectedConversationId}`, {
          cache: "no-store",
        });
        if (messagesRes.ok) {
          const msgs = (await messagesRes.json()) as Message[];
          setMessages(msgs);
        }
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [selectedConversationId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || messageSending || !selectedConversationId) return;

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
          conversationId: selectedConversationId,
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
      setConversations((prev) =>
        prev
          .map((c) => (c.id === selectedConversationId ? { ...c, updatedAt: new Date().toISOString() } : c))
          .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageError("Fout bij verzenden. Probeer opnieuw.");
    } finally {
      setMessageSending(false);
    }
  };

  const sendRentalRequest = async () => {
    setRequestError(null);
    if (!selectedItemId) {
      setRequestError("Geen item gevonden voor deze chat.");
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
          itemId: selectedItemId,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-on-surface-variant">Laden...</span>
      </div>
    );
  }

  if (messageError && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4">
        <span className="text-on-surface-variant">{messageError}</span>
        <Link href="/ontdekken" className="bg-primary text-on-primary px-6 py-3 font-label text-xs uppercase tracking-widest">
          Terug naar producten
        </Link>
      </div>
    );
  }

  if (!selectedConversation && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4 px-6">
        <span className="text-on-surface-variant text-center">Nog geen gesprekken. Start een chat via een product om te beginnen.</span>
        <Link href="/ontdekken" className="bg-primary text-on-primary px-6 py-3 font-label text-xs uppercase tracking-widest">
          Naar ontdekken
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-96px)] overflow-hidden w-full bg-surface border border-outline-variant/50">
      <section className="w-full md:w-80 lg:w-96 bg-surface-container-low flex flex-col border-r border-outline-variant/50">
        <div className="p-6 border-b border-outline-variant/50 bg-surface-container">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-2">Gesprekkenlijst</p>
          <h1 className="text-3xl font-headline font-black uppercase tracking-tight">Berichten</h1>
          <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mt-3">
            {conversations.length} {conversations.length === 1 ? "gesprek" : "gesprekken"}
          </p>
        </div>
        <div className="flex-grow overflow-y-auto p-2">
          {conversations.map((conv) => {
            const other = getOtherUser(conv);
            const isSelected = conv.id === selectedConversationId;
            const preview = conv.messages?.[0]?.text || "Open chat";
            const lastTime = conv.messages?.[0]?.createdAt || conv.updatedAt;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedConversationId(conv.id)}
                className={`w-full text-left p-4 border-l-4 transition-colors mb-2 ${
                  isSelected
                    ? "bg-surface-container-lowest border-primary shadow-sm"
                    : "bg-transparent border-transparent hover:bg-surface-container-high"
                }`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center overflow-hidden rounded-full">
                    {other.avatarUrl ? (
                      <img src={other.avatarUrl} alt={other.displayName || "avatar"} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined">person</span>
                    )}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h4 className="font-headline font-bold text-sm truncate uppercase tracking-tight">
                        {other.displayName || "Gebruiker"}
                      </h4>
                      <span className="text-[10px] text-on-surface-variant font-label">
                        {formatClock(lastTime)}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface truncate font-medium">{preview}</p>
                    {conv.item?.title ? (
                      <p className="text-[10px] text-primary uppercase tracking-wider mt-1 truncate">
                        Post: {conv.item.title}
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col flex-grow bg-surface min-w-0">
        <header className="bg-surface-container-low p-6 border-b border-outline-variant/50">
          <div className="flex flex-col xl:flex-row xl:items-stretch gap-4">
            <div className="xl:w-[360px] bg-surface p-4 border border-outline-variant/50 flex items-center gap-4">
              <div className="w-16 h-16 bg-surface-container-high flex items-center justify-center overflow-hidden rounded-full flex-shrink-0">
                {selectedOtherUser?.avatarUrl ? (
                  <img
                    src={selectedOtherUser.avatarUrl}
                    alt={selectedOtherUser.displayName || "avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined">person</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-1">Actieve chat</p>
                <h2 className="font-headline font-black text-xl uppercase tracking-tight truncate">{selectedOtherUser?.displayName || ownerName}</h2>
                <p className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant mt-1">
                  Gesprek met verhuurder
                </p>
              </div>
            </div>

            <div className="flex-1 flex gap-4 items-stretch">
              {selectedConversation?.item ? (
                <Link
                  href={`/products/${encodeURIComponent(selectedConversation.item.id)}`}
                  className="flex-1 flex items-center gap-4 bg-surface p-4 border border-outline-variant/50 hover:bg-surface-container-high transition-colors min-w-0"
                >
                  <div className="w-20 h-20 bg-surface-container-high overflow-hidden flex-shrink-0">
                    {selectedConversation.item.imageUrl ? (
                      <img
                        src={selectedConversation.item.imageUrl}
                        alt={selectedConversation.item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">image</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Post</p>
                    <p className="font-headline font-black text-2xl uppercase tracking-tight truncate text-primary">
                      {selectedConversation.item.title}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-2">Bekijk listing</p>
                  </div>
                </Link>
              ) : (
                <div className="flex-1 bg-surface p-4 border border-outline-variant/50 flex items-center">
                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">Geen post gekoppeld aan deze chat</p>
                </div>
              )}

              <button
                type="button"
                onClick={sendRentalRequest}
                disabled={requestSending}
                className="bg-primary text-on-primary px-6 py-3 font-label text-[11px] uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100 disabled:opacity-60 whitespace-nowrap"
              >
                {requestSending ? "Aanvraag..." : "Direct Huuraanvraag"}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-grow p-6 md:p-8 overflow-y-auto flex flex-col gap-6 bg-surface-bright">
          <div className="flex justify-center">
            <span className="bg-surface-container-low px-4 py-1 text-[9px] font-label uppercase tracking-widest text-on-surface-variant">
              {isoTodayLabel()}
            </span>
          </div>

          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-on-surface-variant text-sm">Berichten laden...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-on-surface-variant text-sm bg-surface-container-low px-5 py-3 uppercase tracking-widest text-[11px]">
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
                  <div className="w-8 h-8 bg-surface-container-high flex items-center justify-center mt-1 overflow-hidden rounded-full">
                    {m.author.avatarUrl ? (
                      <img
                        src={m.author.avatarUrl}
                        alt={m.author.displayName || "avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-sm">person</span>
                    )}
                  </div>
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

        <footer className="p-6 bg-surface-container-low border-t border-outline-variant/50">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-3">Berichtvak</p>
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
          {messages.length === 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {dmStarters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => {
                    setInput(starter);
                    if (messageError) setMessageError(null);
                  }}
                  className="px-3 py-2 bg-surface-container-high text-on-surface text-[11px] uppercase tracking-wide font-semibold hover:bg-primary hover:text-on-primary transition-colors"
                >
                  {starter}
                </button>
              ))}
            </div>
          ) : null}
          <div className="bg-surface-container-high p-3 flex items-end gap-2 border-2 border-outline-variant/60 shadow-sm">
            <div className="flex flex-col flex-grow">
              <textarea
                className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:ring-0 p-4 text-sm resize-none font-body"
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
    </div>
  );
}
