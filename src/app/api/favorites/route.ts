import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createNotificationIfAllowed } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const itemId = (url.searchParams.get("itemId") ?? "").trim();

  if (itemId) {
    const favorite = await prisma.favorite.findUnique({
      where: { userId_itemId: { userId: user.id, itemId } },
      select: { id: true },
    });
    return NextResponse.json({ isFavorite: Boolean(favorite) });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      item: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          location: true,
          pricePerDayCents: true,
          owner: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ favorites });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Je moet eerst inloggen." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { itemId?: string } | null;
  const itemId = body?.itemId?.trim();
  if (!itemId) return NextResponse.json({ error: "itemId is verplicht." }, { status: 400 });

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, title: true, ownerId: true, status: true },
  });

  if (!item || item.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Item niet gevonden." }, { status: 404 });
  }

  await prisma.favorite.upsert({
    where: { userId_itemId: { userId: user.id, itemId: item.id } },
    update: {},
    create: { userId: user.id, itemId: item.id },
  });

  if (item.ownerId !== user.id) {
    await createNotificationIfAllowed({
      userId: item.ownerId,
      type: "ITEM",
      title: "Je item is gefavoriet",
      body: `${item.title} is toegevoegd aan iemands favorieten.`,
      data: { itemId: item.id, event: "favorited" },
    });
  }

  return NextResponse.json({ ok: true, isFavorite: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Je moet eerst inloggen." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { itemId?: string } | null;
  const itemId = body?.itemId?.trim();
  if (!itemId) return NextResponse.json({ error: "itemId is verplicht." }, { status: 400 });

  await prisma.favorite.deleteMany({
    where: { userId: user.id, itemId },
  });

  return NextResponse.json({ ok: true, isFavorite: false });
}
