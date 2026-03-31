import { NextResponse } from "next/server";
import { sha256Hex } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();
  const baseUrl = process.env.APP_BASE_URL || `${url.protocol}//${url.host}`;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/dashboard?verified=missing`);
  }

  const tokenHash = sha256Hex(token);

  const verification = await prisma.verificationToken.findFirst({
    where: {
      tokenHash,
      type: "EMAIL",
      consumedAt: null,
    },
  });

  if (!verification) {
    return NextResponse.redirect(`${baseUrl}/dashboard?verified=invalid`);
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(`${baseUrl}/dashboard?verified=expired`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() },
    }),
    prisma.verificationToken.updateMany({
      where: {
        userId: verification.userId,
        type: "EMAIL",
        consumedAt: null,
        NOT: { id: verification.id },
      },
      data: { consumedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(`${baseUrl}/dashboard?verified=ok`);
}
