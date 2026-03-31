import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseItemIdFromRequest(req: Request): string {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || "");
}

export async function GET(req: Request) {
  const itemId = parseItemIdFromRequest(req);
  if (!itemId) {
    return NextResponse.json({ error: "Ongeldig item." }, { status: 400 });
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item niet gevonden." }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to get item:", error);
    return NextResponse.json(
      { error: "Failed to get item" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Je moet eerst inloggen." }, { status: 401 });
  }

  const itemId = parseItemIdFromRequest(req);
  if (!itemId) {
    return NextResponse.json({ error: "Ongeldig item." }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        title?: string;
        subtitle?: string | null;
        description?: string | null;
        location?: string | null;
        imageUrl?: string | null;
        pricePerDay?: number;
      }
    | null;

  const title = body?.title?.trim();
  const subtitle = body?.subtitle?.trim() || null;
  const description = body?.description?.trim() || null;
  const location = body?.location?.trim() || null;
  const imageUrl = body?.imageUrl?.trim() || null;
  const pricePerDay = Number(body?.pricePerDay ?? 0);

  if (!title || title.length < 3) {
    return NextResponse.json({ error: "Titel moet minimaal 3 tekens zijn." }, { status: 400 });
  }
  if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) {
    return NextResponse.json({ error: "Prijs per dag moet groter zijn dan 0." }, { status: 400 });
  }

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, ownerId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Item niet gevonden." }, { status: 404 });
  }

  if (existing.ownerId !== user.id) {
    return NextResponse.json({ error: "Geen toegang tot dit item." }, { status: 403 });
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      title,
      subtitle,
      description,
      location,
      imageUrl,
      pricePerDayCents: Math.round(pricePerDay * 100),
    },
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ item });
}
