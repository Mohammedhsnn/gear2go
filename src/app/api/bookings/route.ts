import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createNotificationIfAllowed } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

function parseISODateAtMidnight(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function daysInclusive(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const role = url.searchParams.get("role") === "owner" ? "owner" : "renter";

  const bookings = await prisma.booking.findMany({
    where: role === "owner" ? { ownerId: user.id } : { renterId: user.id },
    include: {
      item: { select: { id: true, title: true, imageUrl: true, pricePerDayCents: true } },
      renter: { select: { id: true, displayName: true, email: true } },
      owner: { select: { id: true, displayName: true, email: true } },
      conversations: {
        select: { id: true },
        take: 1,
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({
    bookings: bookings.map((booking) => ({
      ...booking,
      conversationId: booking.conversations[0]?.id ?? null,
      conversations: undefined,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Je moet eerst inloggen." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        itemId?: string;
        startDateISO?: string;
        endDateISO?: string;
      }
    | null;

  const itemId = body?.itemId?.trim();
  const startDateISO = body?.startDateISO?.trim();
  const endDateISO = body?.endDateISO?.trim();

  if (!itemId || !startDateISO || !endDateISO) {
    return NextResponse.json({ error: "itemId, startDateISO en endDateISO zijn verplicht." }, { status: 400 });
  }

  const startDate = parseISODateAtMidnight(startDateISO);
  const endDate = parseISODateAtMidnight(endDateISO);

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Ongeldige datums." }, { status: 400 });
  }

  if (startDate.getTime() > endDate.getTime()) {
    return NextResponse.json({ error: "Einddatum moet op of na startdatum liggen." }, { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      title: true,
      ownerId: true,
      status: true,
      pricePerDayCents: true,
    },
  });

  if (!item || item.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Item niet beschikbaar." }, { status: 404 });
  }

  if (item.ownerId === user.id) {
    return NextResponse.json({ error: "Je kunt je eigen item niet huren." }, { status: 400 });
  }

  const hasOverlap = await prisma.booking.findFirst({
    where: {
      itemId: item.id,
      status: { in: ["REQUESTED", "CONFIRMED"] },
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
      ],
    },
    select: { id: true },
  });

  if (hasOverlap) {
    return NextResponse.json({ error: "Deze periode is niet beschikbaar." }, { status: 409 });
  }

  const rentalDays = daysInclusive(startDate, endDate);
  const totalCents = rentalDays * item.pricePerDayCents;

  const booking = await prisma.booking.create({
    data: {
      itemId: item.id,
      renterId: user.id,
      ownerId: item.ownerId,
      startDate,
      endDate,
      totalCents,
      status: "REQUESTED",
    },
    include: {
      item: { select: { id: true, title: true } },
    },
  });

  const sortedIds = [user.id, item.ownerId].sort();
  const conversation = await prisma.conversation.upsert({
    where: {
      userOneId_userTwoId: {
        userOneId: sortedIds[0],
        userTwoId: sortedIds[1],
      },
    },
    update: {
      itemId: item.id,
      bookingId: booking.id,
      updatedAt: new Date(),
    },
    create: {
      userOneId: sortedIds[0],
      userTwoId: sortedIds[1],
      itemId: item.id,
      bookingId: booking.id,
    },
    select: { id: true },
  });

  await createNotificationIfAllowed({
    userId: item.ownerId,
    type: "ITEM",
    title: "Nieuwe boekingsaanvraag",
    body: `${item.title} heeft een nieuwe aanvraag (${startDateISO} t/m ${endDateISO}).`,
    data: { bookingId: booking.id, status: booking.status },
  });

  return NextResponse.json({ booking, conversationId: conversation.id }, { status: 201 });
}
