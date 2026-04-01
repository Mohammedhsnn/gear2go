import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createNotificationIfAllowed } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { itemId },
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
    | { itemId?: string; rating?: number; text?: string }
    | null;
  const itemId = body?.itemId;
  const rating = Number(body?.rating);
  const text = (body?.text ?? "").trim() || null;

  if (!itemId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const review = await prisma.review.create({
    data: {
      itemId,
      rating,
      text,
      authorId: user.id,
      subjectUserId: item.ownerId,
    },
  });

  // Create a notification for the owner (best-effort)
  createNotificationIfAllowed({
    userId: item.ownerId,
    type: "REVIEW",
    title: "Nieuwe review",
    body: text ? text.slice(0, 140) : "Je item heeft een nieuwe review ontvangen.",
    data: { itemId, reviewId: review.id },
  }).catch(() => {});

  return NextResponse.json({ review });
}

