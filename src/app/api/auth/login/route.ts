import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";

  if (!email || !email.includes("@") || password.length === 0) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });

  if (!user.emailVerifiedAt) {
    return NextResponse.json(
      {
        error: "Bevestig eerst je e-mailadres via de link in je mailbox.",
        code: "EMAIL_NOT_VERIFIED",
      },
      { status: 403 },
    );
  }

  await createSession(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, displayName: user.displayName },
  });
}

