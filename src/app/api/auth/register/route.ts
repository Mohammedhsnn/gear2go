import { NextResponse } from "next/server";
import { hashPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string; displayName?: string }
    | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  const displayName = body?.displayName?.trim() || null;

  if (!email || !email.includes("@") || password.length < 8) {
    return NextResponse.json(
      { error: "Invalid email or password (min 8 chars)." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      privacy: { create: {} },
    },
    select: { id: true, email: true, displayName: true, createdAt: true },
  });

  await createSession(user.id);
  return NextResponse.json({ user });
}

