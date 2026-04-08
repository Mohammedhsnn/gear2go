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
        status?: "DRAFT" | "PUBLISHED" | "PAUSED" | "ARCHIVED";
      }
    | null;

  const hasTitle = typeof body?.title === "string";
  const hasSubtitle = typeof body?.subtitle === "string" || body?.subtitle === null;
  const hasDescription = typeof body?.description === "string" || body?.description === null;
  const hasLocation = typeof body?.location === "string" || body?.location === null;
  const hasImageUrl = typeof body?.imageUrl === "string" || body?.imageUrl === null;
  const hasPricePerDay = body?.pricePerDay !== undefined;
  const hasStatus = typeof body?.status === "string";

  const title = hasTitle ? body?.title?.trim() : undefined;
  const subtitle = hasSubtitle
    ? body?.subtitle == null
      ? null
      : body.subtitle.trim() || null
    : undefined;
  const description = hasDescription
    ? body?.description == null
      ? null
      : body.description.trim() || null
    : undefined;
  const location = hasLocation
    ? body?.location == null
      ? null
      : body.location.trim() || null
    : undefined;
  const imageUrl = hasImageUrl
    ? body?.imageUrl == null
      ? null
      : body.imageUrl.trim() || null
    : undefined;
  const pricePerDay = hasPricePerDay ? Number(body?.pricePerDay) : undefined;
  const status = hasStatus ? body?.status : undefined;

  if (hasTitle && (!title || title.length < 3)) {
    return NextResponse.json({ error: "Titel moet minimaal 3 tekens zijn." }, { status: 400 });
  }
  if (hasPricePerDay && (!Number.isFinite(pricePerDay) || (pricePerDay ?? 0) <= 0)) {
    return NextResponse.json({ error: "Prijs per dag moet groter zijn dan 0." }, { status: 400 });
  }
  if (hasStatus && !["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED"].includes(status!)) {
    return NextResponse.json({ error: "Ongeldige status." }, { status: 400 });
  }

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, ownerId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Item niet gevonden." }, { status: 404 });
  }

  if (existing.ownerId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: "Geen toegang tot dit item." }, { status: 403 });
  }

  const data: {
    title?: string;
    subtitle?: string | null;
    description?: string | null;
    location?: string | null;
    imageUrl?: string | null;
    pricePerDayCents?: number;
    status?: "DRAFT" | "PUBLISHED" | "PAUSED" | "ARCHIVED";
  } = {};

  if (hasTitle) data.title = title;
  if (hasSubtitle) data.subtitle = subtitle;
  if (hasDescription) data.description = description;
  if (hasLocation) data.location = location;
  if (hasImageUrl) data.imageUrl = imageUrl;
  if (hasPricePerDay) data.pricePerDayCents = Math.round((pricePerDay ?? 0) * 100);
  if (hasStatus) data.status = status;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Geen wijzigingen ontvangen." }, { status: 400 });
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data,
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Je moet eerst inloggen." }, { status: 401 });
  }

  const itemId = parseItemIdFromRequest(req);
  if (!itemId) {
    return NextResponse.json({ error: "Ongeldig item." }, { status: 400 });
  }

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, ownerId: true, title: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Item niet gevonden." }, { status: 404 });
  }

  if (existing.ownerId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: "Alleen admins of de eigenaar mogen listings verwijderen." }, { status: 403 });
  }

  await prisma.item.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true, deletedItemId: existing.id, deletedItemTitle: existing.title });
}
