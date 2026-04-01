"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  ownerName: string;
  productTitle: string;
  itemId: string;
  conversationId?: string;
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
  unreadCount?: number;
  userOne: { id: string; displayName: string | null; avatarUrl?: string | null };
  userTwo: { id: string; displayName: string | null; avatarUrl?: string | null };
  item?: {
    id: string;
    title: string;
    imageUrl?: string | null;
    pricePerDayCents?: number | null;
    ownerId?: string | null;
  } | null;
  booking?: { id: string; status: "REQUESTED" | "CONFIRMED" | "DECLINED" } | null;
  messages?: Array<{ text: string; createdAt: string; authorId: string }>;
};

type ParsedMessage =
  | { kind: "text"; text: string }
  | { kind: "image"; url: string; caption: string }
  | {
      kind: "offer";
      amountCents: number;
      startDateISO: string;
      endDateISO: string;
      status: "REQUESTED" | "CONFIRMED" | "DECLINED";
      bookingId: string | null;
    };

function toIsoDate(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysInclusive(startISO: string, endISO: string): number {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function formatEUR(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function parsePayload(text: string): ParsedMessage {
  if (text.startsWith("__IMG__|")) {
    const raw = text.slice("__IMG__|".length).split("|");
    const map = new Map(raw.map((part) => {
      const [k, ...rest] = part.split("=");
      return [k, rest.join("=")];
    }));
    const url = map.get("url") || "";
    const caption = decodeURIComponent(map.get("caption") || "");
    if (url) return { kind: "image", url, caption };
  }

  if (text.startsWith("__OFFER__|")) {
    const raw = text.slice("__OFFER__|".length).split("|");
    const map = new Map(raw.map((part) => {
      const [k, ...rest] = part.split("=");
      return [k, rest.join("=")];
    }));
    const amountCents = Number(map.get("amountCents") || "0");
    const startDateISO = map.get("start") || "";
    const endDateISO = map.get("end") || "";
    const bookingId = map.get("bookingId") || null;
    const rawStatus = map.get("status") || "REQUESTED";
    const status = rawStatus === "CONFIRMED" || rawStatus === "DECLINED" ? rawStatus : "REQUESTED";
    if (amountCents > 0 && startDateISO && endDateISO) {
      return { kind: "offer", amountCents, startDateISO, endDateISO, status, bookingId };
    }
  }

  return { kind: "text", text };
}

function conversationPreview(text: string): string {
  const parsed = parsePayload(text);
  if (parsed.kind === "image") return "Foto gestuurd";
  if (parsed.kind === "offer") return `Bod: ${formatEUR(parsed.amountCents)}`;
  return parsed.text;
}

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
  conversationId = "",
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
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerBookingId, setOfferBookingId] = useState<string | null>(null);
  const [offerStartDate, setOfferStartDate] = useState("");
  const [offerEndDate, setOfferEndDate] = useState("");
  const [offerAmountEUR, setOfferAmountEUR] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [offerActionBusyBookingId, setOfferActionBusyBookingId] = useState<string | null>(null);

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
  const selectedPricePerDayCents = selectedConversation?.item?.pricePerDayCents ?? 0;
  const isCurrentUserOwnerInSelectedChat = Boolean(
    selectedConversation?.item?.ownerId &&
      currentUser?.id &&
      selectedConversation.item.ownerId === currentUser.id,
  );
  const offerDays =
    offerStartDate && offerEndDate && offerStartDate <= offerEndDate
      ? daysInclusive(offerStartDate, offerEndDate)
      : 0;
  const offerTotalCents = offerDays > 0 ? offerDays * selectedPricePerDayCents : 0;
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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const end = new Date(tomorrow);
    end.setDate(end.getDate() + 2);
    setOfferStartDate(toIsoDate(tomorrow));
    setOfferEndDate(toIsoDate(end));
  }, []);

  useEffect(() => {
    if (!offerModalOpen) return;
    if (offerTotalCents > 0) {
      setOfferAmountEUR((offerTotalCents / 100).toFixed(2).replace(".", ","));
    }
  }, [offerModalOpen, offerTotalCents]);

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
        let preferredId: string | null = conversationId || null;

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
        if (preferredId && !list.some((c) => c.id === preferredId)) {
          preferredId = null;
        }
        setSelectedConversationId(preferredId ?? null);

        setLoading(false);
      } catch (error) {
        console.error("Failed to load conversation:", error);
        setMessageError("Kon gesprek niet laden. Probeer opnieuw.");
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, currentUser, itemId]);

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
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === selectedConversationId ? { ...conv, unreadCount: 0 } : conv,
            ),
          );
        }
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [selectedConversationId]);

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !imagePreview) || messageSending || !selectedConversationId) return;

    setMessageSending(true);
    setMessageError(null);

    try {
      let safeText = text;
      if (!imagePreview) {
        // Moderate only plain text messages. Attachments are validated server-side.
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

        safeText = moderation.text;
      }

      // Send message
      const messageRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          text: safeText,
          imageBase64: imagePreview,
        }),
      });

      if (!messageRes.ok) {
        setMessageError("Bericht kon niet verzonden worden.");
        return;
      }

      const newMessage = await messageRes.json() as Message;
      setMessages((prev) => [...prev, newMessage]);
      setInput("");
      setImagePreview(null);
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

  const sendRentalRequest = async (): Promise<{ id: string; totalCents: number; status: string } | null> => {
    setRequestError(null);
    setRequestSuccess(null);
    if (!selectedItemId) {
      setRequestError("Geen item gevonden voor deze chat.");
      return null;
    }

    if (!offerStartDate || !offerEndDate) {
      setRequestError("Kies een start- en einddatum voor je bod.");
      return null;
    }

    if (offerStartDate > offerEndDate) {
      setRequestError("Einddatum moet op of na startdatum liggen.");
      return null;
    }

    setRequestSending(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItemId,
          startDateISO: offerStartDate,
          endDateISO: offerEndDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Onbekende fout" })) as { error?: string };
        setRequestError(data?.error || "Huuraanvraag versturen is niet gelukt.");
        setRequestSending(false);
        return null;
      }

      const payload = (await res.json()) as {
        booking?: { id: string; totalCents: number; status: string };
      };

      setRequestSending(false);
      return payload.booking ?? null;
    } catch (error) {
      console.error("Failed to send rental request:", error);
      setRequestError("Fout bij verzenden huuraanvraag.");
      setRequestSending(false);
      return null;
    }
  };

  async function sendOfferCardMessage(input: {
    amountCents: number;
    startDateISO: string;
    endDateISO: string;
    status: "REQUESTED" | "CONFIRMED" | "DECLINED";
    bookingId: string;
  }) {
    if (!selectedConversationId) return false;

    const messageRes = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: selectedConversationId,
        text: `__OFFER__|amountCents=${input.amountCents}|start=${input.startDateISO}|end=${input.endDateISO}|status=${input.status}|bookingId=${input.bookingId}`,
      }),
    });

    if (!messageRes.ok) return false;

    const createdMessage = (await messageRes.json()) as Message;
    setMessages((prev) => [...prev, createdMessage]);
    setConversations((prev) =>
      prev
        .map((c) => (c.id === selectedConversationId ? { ...c, updatedAt: new Date().toISOString() } : c))
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    );

    return true;
  }

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
                      <div className="flex items-center gap-2">
                        {conv.unreadCount && conv.unreadCount > 0 ? (
                          <span className="min-w-5 h-5 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        ) : null}
                        <span className="text-[10px] text-on-surface-variant font-label">
                          {formatClock(lastTime)}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs truncate font-medium ${conv.unreadCount && conv.unreadCount > 0 ? "text-on-surface font-bold" : "text-on-surface"}`}>
                      {conversationPreview(preview)}
                    </p>
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
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center bg-surface-bright border-l border-outline-variant/30">
            <div className="text-center px-8 max-w-xl">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-3">Berichten Home</p>
              <h2 className="font-headline font-black text-4xl uppercase tracking-tight mb-4">Kies een gesprek</h2>
              <p className="text-on-surface-variant text-sm uppercase tracking-wider">
                Selecteer links een gesprek om berichten te lezen of te versturen.
              </p>
            </div>
          </div>
        ) : (
          <>
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

              {!isCurrentUserOwnerInSelectedChat ? (
                <button
                  type="button"
                  onClick={() => {
                    setRequestError(null);
                    setRequestSuccess(null);
                    setOfferBookingId(null);
                    setOfferModalOpen(true);
                  }}
                  disabled={requestSending}
                  className="bg-primary text-on-primary px-6 py-3 font-label text-[11px] uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100 disabled:opacity-60 whitespace-nowrap"
                >
                  {requestSending ? "Bod..." : "Maak Bod"}
                </button>
              ) : null}
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
              const parsed = parsePayload(m.text);
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
                    {parsed.kind === "text" ? (
                      <div className={isMine ? "bg-primary p-4 text-sm leading-relaxed text-on-primary" : "bg-surface-container-high p-4 text-sm leading-relaxed text-on-surface"}>
                        {parsed.text}
                      </div>
                    ) : null}
                    {parsed.kind === "image" ? (
                      <div className={isMine ? "bg-primary/15 p-3 border border-primary/25" : "bg-surface-container-high p-3 border border-outline-variant/30"}>
                        <img src={parsed.url} alt="Chat afbeelding" className="max-w-[260px] rounded border border-outline-variant/20" />
                        {parsed.caption ? (
                          <p className="mt-2 text-xs text-on-surface">{parsed.caption}</p>
                        ) : null}
                      </div>
                    ) : null}
                    {parsed.kind === "offer" ? (
                      (() => {
                        const bookingIdForCard = parsed.bookingId || selectedConversation?.booking?.id || null;
                        const effectiveStatus: "REQUESTED" | "CONFIRMED" | "DECLINED" =
                          bookingIdForCard && selectedConversation?.booking?.id === bookingIdForCard
                            ? selectedConversation.booking.status
                            : parsed.status;
                        const offerHeading =
                          effectiveStatus === "CONFIRMED"
                            ? isMine
                              ? "Jij accepteerde bod"
                              : "Verhuurder accepteerde bod"
                            : effectiveStatus === "DECLINED"
                              ? "Bod geweigerd"
                              : isMine
                                ? "Jij deed een bod"
                                : "Nieuw bod ontvangen";

                        return (
                      <div className="bg-surface-container-low p-3 border-2 border-outline/70 shadow-sm min-w-[250px]">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">
                            {offerHeading}
                          </p>
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${effectiveStatus === "CONFIRMED" ? "bg-[#dcfce7] text-[#166534]" : effectiveStatus === "DECLINED" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#fef3c7] text-[#92400e]"}`}>
                            {effectiveStatus === "CONFIRMED" ? "Dicht" : effectiveStatus === "DECLINED" ? "Dicht" : "Open"}
                          </span>
                        </div>
                        <p className="font-black text-xl">{formatEUR(parsed.amountCents)}</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {parsed.startDateISO} t/m {parsed.endDateISO}
                        </p>
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {!isMine && effectiveStatus === "REQUESTED" && bookingIdForCard ? (
                            <button
                              type="button"
                              className="bg-[#166534] text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
                              disabled={offerActionBusyBookingId === bookingIdForCard}
                              onClick={async () => {
                                if (offerActionBusyBookingId === bookingIdForCard) return;
                                setOfferActionBusyBookingId(bookingIdForCard);

                                try {
                                  const res = await fetch(`/api/bookings/${encodeURIComponent(bookingIdForCard)}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ decision: "accept" }),
                                  });

                                  if (!res.ok) {
                                    const data = (await res.json().catch(() => ({}))) as { error?: string };
                                    setMessageError(data.error || "Bod accepteren is niet gelukt.");
                                    return;
                                  }

                                  setConversations((prev) =>
                                    prev.map((conv) =>
                                      conv.id === selectedConversationId
                                        ? {
                                            ...conv,
                                            booking: conv.booking
                                              ? { ...conv.booking, status: "CONFIRMED" }
                                              : conv.booking,
                                          }
                                        : conv,
                                    ),
                                  );

                                  setMessages((prev) =>
                                    prev.map((msg) => {
                                      const p = parsePayload(msg.text);
                                      if (p.kind !== "offer") return msg;
                                      if ((p.bookingId || null) !== bookingIdForCard) return msg;
                                      if (p.status !== "REQUESTED") return msg;
                                      return {
                                        ...msg,
                                        text: msg.text.replace(/\|status=REQUESTED(?=\||$)/, "|status=CONFIRMED"),
                                      };
                                    }),
                                  );

                                  const hasConfirmedAlready = messages.some((msg) => {
                                    const p = parsePayload(msg.text);
                                    return p.kind === "offer" && p.bookingId === bookingIdForCard && p.status === "CONFIRMED";
                                  });

                                  if (!hasConfirmedAlready) {
                                    const statusRes = await fetch("/api/messages", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        conversationId: selectedConversationId,
                                        text: `__OFFER__|amountCents=${parsed.amountCents}|start=${parsed.startDateISO}|end=${parsed.endDateISO}|status=CONFIRMED|bookingId=${bookingIdForCard}`,
                                      }),
                                    });

                                    if (statusRes.ok) {
                                      const createdMessage = (await statusRes.json()) as Message;
                                      setMessages((prev) => [...prev, createdMessage]);
                                    }
                                  }
                                } finally {
                                  setOfferActionBusyBookingId(null);
                                }
                              }}
                            >
                              Accepteer bod
                            </button>
                          ) : null}
                          {!isMine && effectiveStatus === "REQUESTED" ? (
                            <button
                              type="button"
                              className="bg-primary text-on-primary px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
                              disabled={offerActionBusyBookingId === bookingIdForCard}
                              onClick={() => {
                                setOfferStartDate(parsed.startDateISO);
                                setOfferEndDate(parsed.endDateISO);
                                setOfferAmountEUR((parsed.amountCents / 100).toFixed(2).replace(".", ","));
                                setOfferBookingId(bookingIdForCard);
                                setOfferModalOpen(true);
                              }}
                            >
                              Doe tegenbod
                            </button>
                          ) : null}
                        </div>
                      </div>
                        );
                      })()
                    ) : null}
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
          {imagePreview ? (
            <div className="mb-3 bg-surface-container-high p-3 border border-outline-variant/30 inline-flex items-start gap-3">
              <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover border border-outline-variant/20" />
              <button
                type="button"
                className="text-xs uppercase tracking-widest underline"
                onClick={() => setImagePreview(null)}
              >
                Verwijder foto
              </button>
            </div>
          ) : null}
          {requestError ? (
            <div className="mb-3 bg-[#fee2e2] text-[#991b1b] px-4 py-3 text-xs font-semibold uppercase tracking-wider">
              {requestError}
            </div>
          ) : null}
          {requestSuccess ? (
            <div className="mb-3 bg-[#dcfce7] text-[#166534] px-4 py-3 text-xs font-semibold uppercase tracking-wider">
              {requestSuccess}
            </div>
          ) : null}
          {!messagesLoading && messages.length === 0 ? (
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
            <label className="bg-surface-container-lowest border border-outline-variant/40 p-3 cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant">image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 8 * 1024 * 1024) {
                    setMessageError("Afbeelding te groot (max 8MB).");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImagePreview(typeof reader.result === "string" ? reader.result : null);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
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
          </>
        )}
      </section>

      {offerModalOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-surface border border-outline-variant/40 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
              <h3 className="font-headline font-black text-2xl uppercase tracking-tight text-primary">Maak Bod</h3>
              <button
                type="button"
                className="material-symbols-outlined text-on-surface-variant hover:text-primary"
                onClick={() => setOfferModalOpen(false)}
                aria-label="Sluiten"
              >
                close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Startdatum</span>
                <input
                  type="date"
                  className="bg-surface-container-lowest border border-outline-variant/40 px-3 py-3 text-sm"
                  value={offerStartDate}
                  onChange={(e) => setOfferStartDate(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Einddatum</span>
                <input
                  type="date"
                  className="bg-surface-container-lowest border border-outline-variant/40 px-3 py-3 text-sm"
                  value={offerEndDate}
                  onChange={(e) => setOfferEndDate(e.target.value)}
                />
              </label>

              <div className="bg-surface-container-low p-4 border border-outline-variant/25">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Indicatie bod</p>
                <p className="font-bold text-lg">{offerAmountEUR ? `€ ${offerAmountEUR}` : "-"}</p>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Bodbedrag (EUR)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="bg-surface-container-lowest border border-outline-variant/40 px-3 py-3 text-sm"
                  value={offerAmountEUR}
                  onChange={(e) => setOfferAmountEUR(e.target.value.replace(/[^0-9.,]/g, ""))}
                  placeholder="Bijv. 99,95"
                />
              </label>

              {requestError ? (
                <div className="bg-[#fee2e2] text-[#991b1b] px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                  {requestError}
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-outline-variant/30 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-3 border border-outline-variant/40 text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high"
                onClick={() => setOfferModalOpen(false)}
                disabled={requestSending}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest hover:bg-surface-dim hover:text-primary disabled:opacity-60"
                onClick={async () => {
                  const normalized = offerAmountEUR.replace(",", ".");
                  const parsedAmount = Number(normalized);
                  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                    setRequestError("Vul een geldig bodbedrag in.");
                    return;
                  }

                  if (!selectedConversationId) {
                    setRequestError("Open eerst een gesprek om een bod te versturen.");
                    return;
                  }

                  setRequestError(null);
                  const amountCents = Math.round(parsedAmount * 100);

                  if (offerBookingId) {
                    const ok = await sendOfferCardMessage({
                      amountCents,
                      startDateISO: offerStartDate,
                      endDateISO: offerEndDate,
                      status: "REQUESTED",
                      bookingId: offerBookingId,
                    });
                    if (!ok) {
                      setRequestError("Tegenbod versturen is niet gelukt.");
                      return;
                    }
                    setRequestSuccess("Tegenbod verstuurd.");
                    setOfferModalOpen(false);
                    return;
                  }

                  const booking = await sendRentalRequest();
                  if (!booking) return;

                  const ok = await sendOfferCardMessage({
                    amountCents,
                    startDateISO: offerStartDate,
                    endDateISO: offerEndDate,
                    status: booking.status as "REQUESTED" | "CONFIRMED" | "DECLINED",
                    bookingId: booking.id,
                  });
                  if (!ok) {
                    setRequestError("Bodbericht versturen is niet gelukt.");
                    return;
                  }

                  setRequestSuccess("Bod verstuurd. De verhuurder krijgt direct een aanvraag.");
                  setOfferModalOpen(false);
                }}
                disabled={requestSending}
              >
                {requestSending ? "Versturen..." : "Stuur Bod"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
