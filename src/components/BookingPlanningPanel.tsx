"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookingReviewForm } from "@/components/BookingReviewForm";

type BookingStatus = "REQUESTED" | "CONFIRMED" | "DECLINED";

type Booking = {
  id: string;
  conversationId?: string | null;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  totalCents: number;
  item: {
    id: string;
    title: string;
    imageUrl: string | null;
    pricePerDayCents: number;
  };
  renter: {
    id: string;
    displayName: string | null;
    email: string;
  };
  owner: {
    id: string;
    displayName: string | null;
    email: string;
  };
  reviews?: Array<{
    id: string;
    authorId: string;
    direction: "RENTER_TO_OWNER" | "OWNER_TO_RENTER";
  }>;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function canReviewAfterEndDate(endDateISO: string): boolean {
  const endDate = new Date(endDateISO);
  if (Number.isNaN(endDate.getTime())) return false;
  const reviewOpensAt = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  return Date.now() >= reviewOpensAt.getTime();
}

function formatEUR(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function toLabel(status: BookingStatus): string {
  if (status === "REQUESTED") return "Aangevraagd";
  if (status === "CONFIRMED") return "Bevestigd";
  return "Geweigerd";
}

function badgeClass(status: BookingStatus): string {
  if (status === "REQUESTED") {
    return "bg-[#fef3c7] text-[#92400e]";
  }
  if (status === "CONFIRMED") {
    return "bg-[#dcfce7] text-[#166534]";
  }
  return "bg-[#fee2e2] text-[#991b1b]";
}

function buildChatHref(booking: Booking, mode: "owner" | "renter"): string {
  const counterpart =
    mode === "owner"
      ? booking.renter.displayName || booking.renter.email
      : booking.owner.displayName || booking.owner.email;

  if (booking.conversationId) {
    return `/berichten/${encodeURIComponent(booking.conversationId)}`;
  }

  return `/berichten?owner=${encodeURIComponent(counterpart)}&product=${encodeURIComponent(booking.item.title)}&itemId=${encodeURIComponent(booking.item.id)}`;
}

export function BookingPlanningPanel() {
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [renterBookings, setRenterBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ownerRequestedCount = useMemo(
    () => ownerBookings.filter((b) => b.status === "REQUESTED").length,
    [ownerBookings],
  );

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [ownerRes, renterRes] = await Promise.all([
        fetch("/api/bookings?role=owner", { cache: "no-store" }),
        fetch("/api/bookings?role=renter", { cache: "no-store" }),
      ]);

      if (!ownerRes.ok || !renterRes.ok) {
        throw new Error("Boekingen konden niet worden geladen.");
      }

      const [ownerJson, renterJson] = await Promise.all([
        ownerRes.json() as Promise<{ bookings: Booking[] }>,
        renterRes.json() as Promise<{ bookings: Booking[] }>,
      ]);

      setOwnerBookings(ownerJson.bookings || []);
      setRenterBookings(renterJson.bookings || []);
    } catch {
      setError("Boekingen konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decideBooking(bookingId: string, decision: "accept" | "decline") {
    setBusyId(bookingId);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Boeking kon niet worden bijgewerkt.");
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Boeking kon niet worden bijgewerkt.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-16">
      <div className="flex justify-between items-end mb-8 border-b border-primary/5 pb-4">
        <h2 className="text-3xl font-black uppercase tracking-tight font-headline">
          Boeking & Planning
        </h2>
        <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {ownerRequestedCount} open aanvraag(en)
        </div>
      </div>

      {error ? (
        <div className="mb-6 bg-[#fee2e2] text-[#991b1b] px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="bg-surface-container-low p-8 uppercase tracking-widest text-xs text-on-surface-variant">
          Boekingen laden...
        </div>
      ) : null}

      {!loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-surface-container-low p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4">
              Aanvragen voor mijn gear
            </h3>
            {ownerBookings.length === 0 ? (
              <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                Nog geen aanvragen ontvangen.
              </p>
            ) : (
              <div className="space-y-4">
                {ownerBookings.map((booking) => (
                  <article key={booking.id} className="bg-surface p-4 border border-outline-variant/20">
                    {/** Reviews become available only after the booking end date. */}
                    {(() => {
                      const reviewAllowed = canReviewAfterEndDate(booking.endDate);
                      return (
                        <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold uppercase tracking-tight">{booking.item.title}</p>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">
                          {booking.renter.displayName || booking.renter.email}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeClass(booking.status)}`}>
                        {toLabel(booking.status)}
                      </span>
                    </div>

                    <div className="mt-3 text-xs uppercase tracking-wider text-on-surface-variant">
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                    </div>
                    <div className="mt-1 text-sm font-bold">{formatEUR(booking.totalCents)}</div>

                    <Link
                      href={`/users/${encodeURIComponent(booking.renter.id)}`}
                      className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-widest text-primary underline underline-offset-4 hover:text-on-surface-variant"
                    >
                      Bekijk huurderprofiel
                    </Link>

                    {booking.status === "REQUESTED" ? (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          className="bg-primary text-on-primary py-3 text-xs font-black uppercase tracking-wider disabled:opacity-60"
                          disabled={busyId === booking.id}
                          onClick={() => decideBooking(booking.id, "accept")}
                        >
                          Accepteren
                        </button>
                        <button
                          type="button"
                          className="bg-surface-container-high text-on-surface py-3 text-xs font-black uppercase tracking-wider disabled:opacity-60"
                          disabled={busyId === booking.id}
                          onClick={() => decideBooking(booking.id, "decline")}
                        >
                          Weigeren
                        </button>
                      </div>
                    ) : null}

                    <Link
                      href={buildChatHref(booking, "owner")}
                      className="mt-3 inline-flex text-xs font-bold uppercase tracking-widest text-primary underline underline-offset-4 hover:text-on-surface-variant"
                    >
                      Ga naar gesprek
                    </Link>

                    {booking.status === "CONFIRMED" ? (
                      !reviewAllowed ? (
                        <div className="mt-4 border border-outline-variant/20 bg-surface-container-low p-3">
                          <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
                            Review beschikbaar na {formatDate(booking.endDate)}
                          </p>
                        </div>
                      ) : booking.reviews?.some(
                        (review) =>
                          review.authorId === booking.owner.id &&
                          review.direction === "OWNER_TO_RENTER",
                      ) ? (
                        <div className="mt-4 border border-primary/30 bg-surface-container-low p-3">
                          <p className="text-[11px] uppercase tracking-widest text-primary font-bold">
                            Review voor huurder is geplaatst
                          </p>
                        </div>
                      ) : (
                        <BookingReviewForm
                          bookingId={booking.id}
                          direction="OWNER_TO_RENTER"
                          onSubmitted={load}
                        />
                      )
                    ) : null}
                        </>
                      );
                    })()}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-container-low p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4">
              Mijn boekingen als huurder
            </h3>
            {renterBookings.length === 0 ? (
              <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                Je hebt nog geen boekingen aangevraagd.
              </p>
            ) : (
              <div className="space-y-4">
                {renterBookings.map((booking) => (
                  <article key={booking.id} className="bg-surface p-4 border border-outline-variant/20">
                    {/** Reviews become available only after the booking end date. */}
                    {(() => {
                      const reviewAllowed = canReviewAfterEndDate(booking.endDate);
                      return (
                        <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold uppercase tracking-tight">{booking.item.title}</p>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">
                          Verhuurder: {booking.owner.displayName || booking.owner.email}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeClass(booking.status)}`}>
                        {toLabel(booking.status)}
                      </span>
                    </div>

                    <div className="mt-3 text-xs uppercase tracking-wider text-on-surface-variant">
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                    </div>
                    <div className="mt-1 text-sm font-bold">{formatEUR(booking.totalCents)}</div>

                    <Link
                      href={buildChatHref(booking, "renter")}
                      className="mt-3 inline-flex text-xs font-bold uppercase tracking-widest text-primary underline underline-offset-4 hover:text-on-surface-variant"
                    >
                      Ga naar gesprek
                    </Link>

                    {booking.status === "CONFIRMED" ? (
                      !reviewAllowed ? (
                        <div className="mt-4 border border-outline-variant/20 bg-surface-container-low p-3">
                          <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
                            Review beschikbaar na {formatDate(booking.endDate)}
                          </p>
                        </div>
                      ) : booking.reviews?.some(
                        (review) =>
                          review.authorId === booking.renter.id &&
                          review.direction === "RENTER_TO_OWNER",
                      ) ? (
                        <div className="mt-4 border border-primary/30 bg-surface-container-low p-3">
                          <p className="text-[11px] uppercase tracking-widest text-primary font-bold">
                            Review voor verhuurder is geplaatst
                          </p>
                        </div>
                      ) : (
                        <BookingReviewForm
                          bookingId={booking.id}
                          direction="RENTER_TO_OWNER"
                          onSubmitted={load}
                        />
                      )
                    ) : null}
                        </>
                      );
                    })()}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
