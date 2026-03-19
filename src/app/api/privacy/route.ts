import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const privacy = await prisma.privacySettings.findUnique({
    where: { userId: user.id },
  });
  return NextResponse.json({ privacy });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | Partial<{
        marketingEmails: boolean;
        productEmails: boolean;
        pushNotifications: boolean;
        profilePublic: boolean;
      }>
    | null;

  const privacy = await prisma.privacySettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      marketingEmails: body?.marketingEmails ?? false,
      productEmails: body?.productEmails ?? true,
      pushNotifications: body?.pushNotifications ?? true,
      profilePublic: body?.profilePublic ?? true,
    },
    update: {
      ...(typeof body?.marketingEmails === "boolean"
        ? { marketingEmails: body.marketingEmails }
        : {}),
      ...(typeof body?.productEmails === "boolean" ? { productEmails: body.productEmails } : {}),
      ...(typeof body?.pushNotifications === "boolean"
        ? { pushNotifications: body.pushNotifications }
        : {}),
      ...(typeof body?.profilePublic === "boolean" ? { profilePublic: body.profilePublic } : {}),
    },
  });

  return NextResponse.json({ privacy });
}

