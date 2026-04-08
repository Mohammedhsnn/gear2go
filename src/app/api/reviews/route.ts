import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createNotificationIfAllowed } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type ReviewDirection = "RENTER_TO_OWNER" | "OWNER_TO_RENTER";

function isValidRating(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5;
}

function toRoundedAverage(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId")?.trim() || null;
  const subjectUserId = url.searchParams.get("subjectUserId")?.trim() || null;
  const direction = url.searchParams.get("direction")?.trim() as ReviewDirection | undefined;

  if (!itemId && !subjectUserId) {
    return NextResponse.json({ error: "itemId of subjectUserId is verplicht." }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: {
      ...(itemId ? { itemId } : {}),
      ...(subjectUserId ? { subjectUserId } : {}),
      ...(direction === "RENTER_TO_OWNER" || direction === "OWNER_TO_RENTER"
        ? { direction }
        : {}),
    },
    include: {
      author: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        bookingId?: string;
        direction?: ReviewDirection;
        text?: string;
        materialAsDescribedRating?: number;
        communicationRating?: number;
        punctualityRating?: number;
        carefulnessRating?: number;
      }
    | null;
  const bookingId = body?.bookingId?.trim();
  const direction = body?.direction;
  const text = (body?.text ?? "").trim();

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is verplicht." }, { status: 400 });
  }
  if (direction !== "RENTER_TO_OWNER" && direction !== "OWNER_TO_RENTER") {
    return NextResponse.json({ error: "Ongeldige reviewrichting." }, { status: 400 });
  }
  if (text.length < 10) {
    return NextResponse.json({ error: "Motivatie moet minimaal 10 tekens zijn." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      endDate: true,
      itemId: true,
      renterId: true,
      ownerId: true,
      item: { select: { title: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Boeking niet gevonden." }, { status: 404 });
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Reviews zijn alleen mogelijk voor bevestigde boekingen." }, { status: 400 });
  }

  const reviewOpensAt = new Date(booking.endDate.getTime() + 24 * 60 * 60 * 1000);
  if (Date.now() < reviewOpensAt.getTime()) {
    return NextResponse.json(
      { error: "Je kunt pas reviewen na de einddatum van de boeking." },
      { status: 400 },
    );
  }

  let subjectUserId: string;
  let rating: number;
  let materialAsDescribedRating: number | null = null;
  let communicationRating: number | null = null;
  let punctualityRating: number | null = null;
  let carefulnessRating: number | null = null;

  if (direction === "RENTER_TO_OWNER") {
    if (user.id !== booking.renterId) {
      return NextResponse.json({ error: "Alleen de huurder mag deze review plaatsen." }, { status: 403 });
    }

    const material = body?.materialAsDescribedRating;
    const communication = body?.communicationRating;
    if (!isValidRating(material) || !isValidRating(communication)) {
      return NextResponse.json(
        { error: "Geef 1-5 sterren voor 'Materiaal als beschreven' en 'Communicatie'." },
        { status: 400 },
      );
    }

    subjectUserId = booking.ownerId;
    materialAsDescribedRating = material;
    communicationRating = communication;
    rating = toRoundedAverage([material, communication]);
  } else {
    if (user.id !== booking.ownerId) {
      return NextResponse.json({ error: "Alleen de verhuurder mag deze review plaatsen." }, { status: 403 });
    }

    const punctuality = body?.punctualityRating;
    const carefulness = body?.carefulnessRating;
    if (!isValidRating(punctuality) || !isValidRating(carefulness)) {
      return NextResponse.json(
        { error: "Geef 1-5 sterren voor 'Punctualiteit' en 'Zorgvuldigheid'." },
        { status: 400 },
      );
    }

    subjectUserId = booking.renterId;
    punctualityRating = punctuality;
    carefulnessRating = carefulness;
    rating = toRoundedAverage([punctuality, carefulness]);
  }

  const existing = await prisma.review.findUnique({
    where: {
      bookingId_authorId: {
        bookingId: booking.id,
        authorId: user.id,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Je hebt voor deze boeking al een review geplaatst." }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      itemId: booking.itemId,
      direction,
      rating,
      text,
      materialAsDescribedRating,
      communicationRating,
      punctualityRating,
      carefulnessRating,
      authorId: user.id,
      subjectUserId,
    },
  });

  // Create a notification for the owner (best-effort)
  createNotificationIfAllowed({
    userId: subjectUserId,
    type: "REVIEW",
    title: "Nieuwe review",
    body: text.slice(0, 140),
    data: { itemId: booking.itemId, bookingId: booking.id, reviewId: review.id, direction, itemTitle: booking.item.title },
  }).catch(() => {});

  return NextResponse.json({ review });
}

