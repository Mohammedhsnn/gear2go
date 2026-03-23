import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const cat = (url.searchParams.get("cat") ?? "").trim();

  const items = await prisma.item.findMany({
    where: {
      status: "PUBLISHED",
      ...(cat ? { category: { slug: cat } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { subtitle: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      owner: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Je moet eerst inloggen." }, { status: 401 });
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

  const fallbackCategory = await prisma.category.findFirst({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  const item = await prisma.item.create({
    data: {
      ownerId: user.id,
      title,
      subtitle,
      description,
      location,
      imageUrl,
      pricePerDayCents: Math.round(pricePerDay * 100),
      status: "PUBLISHED",
      ...(fallbackCategory ? { categoryId: fallbackCategory.id } : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
