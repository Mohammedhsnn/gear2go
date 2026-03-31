import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { hashPassword } from "@/lib/auth";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { issueEmailVerification } from "@/lib/emailVerification";
import { prisma } from "@/lib/prisma";

type BasicUser = { id: string; email: string; displayName: string | null; createdAt: Date };

const SYSTEM_EMAIL = "gear2go.system@local";

async function createWelcomeInboxForUser(_user: BasicUser) {
  const systemUser = await prisma.user.findUnique({
    where: { email: SYSTEM_EMAIL },
    select: { id: true },
  });
  if (!systemUser) {
    const systemPassword = await hashPassword(`system-${randomUUID()}`);
    await prisma.user.create({
      data: { email: SYSTEM_EMAIL, passwordHash: systemPassword, displayName: "Gear2Go", emailVerifiedAt: new Date() },
      select: { id: true },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: string; password?: string; displayName?: string | null } | null;
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? "";
    const displayName = body?.displayName?.trim() || null;
    if (!email || !email.includes("@") || password.length < 8) {
      return NextResponse.json({ error: "Vul een geldig e-mailadres en wachtwoord (min. 8 tekens) in." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, createdAt: true, emailVerifiedAt: true },
    });
    if (existing) {
      if (existing.emailVerifiedAt) {
        return NextResponse.json({ error: "Dit e-mailadres is al in gebruik." }, { status: 409 });
      }
      const result = await issueEmailVerification(existing, { cooldownSeconds: 60 });
      return NextResponse.json({
        user: { id: existing.id, email: existing.email, displayName: existing.displayName, createdAt: existing.createdAt },
        requiresEmailVerification: true,
        message: isEmailDeliveryConfigured()
          ? "Je account bestaat al. We hebben opnieuw een verificatiemail gestuurd."
          : "Mailserver niet ingesteld in dev. Gebruik de link hieronder om te bevestigen.",
        verificationUrl: result.verificationUrl ?? null,
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });
    await prisma.privacySettings.create({ data: { userId: user.id } });
    await createWelcomeInboxForUser(user);

    const result = await issueEmailVerification(user, { cooldownSeconds: 0 });
    return NextResponse.json({
      user,
      requiresEmailVerification: true,
      message: isEmailDeliveryConfigured()
        ? "Controleer je e-mail en bevestig je account voordat je inlogt."
        : "Mailserver niet ingesteld in dev. Gebruik de link hieronder om te bevestigen.",
      verificationUrl: result.verificationUrl ?? null,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ["EMAIL_DELIVERY_NOT_CONFIGURED", "BREVO_SENDER_NOT_CONFIGURED", "BREVO_SENDER_NOT_VERIFIED"].includes(error.message)
    ) {
      return NextResponse.json({ error: "E-mailservice is nog niet correct geconfigureerd." }, { status: 500 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik." }, { status: 409 });
    }
    return NextResponse.json({ error: "Registratie tijdelijk niet beschikbaar. Probeer het opnieuw." }, { status: 500 });
  }
}
