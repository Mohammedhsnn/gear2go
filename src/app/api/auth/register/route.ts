import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@/generated/prisma";
import { hashPassword } from "@/lib/auth";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { issueEmailVerification } from "@/lib/emailVerification";
import { prisma } from "@/lib/prisma";

type BasicUser = { id: string; email: string; displayName: string | null; createdAt: Date };

const SYSTEM_EMAIL = "gear2go.system@local";

async function createWelcomeInboxForUser(user: BasicUser) {
  let systemUser = await prisma.user.findUnique({
    where: { email: SYSTEM_EMAIL },
    select: { id: true, displayName: true },
  });

  if (!systemUser) {
    const systemPassword = await hashPassword(`system-${randomUUID()}`);
    systemUser = await prisma.user.create({
      data: {
        email: SYSTEM_EMAIL,
        passwordHash: systemPassword,
        displayName: "Gear2Go",
        emailVerifiedAt: new Date(),
      },
      select: { id: true, displayName: true },
    });
  }

  const sortedIds = [user.id, systemUser.id].sort();
  const conversation = await prisma.conversation.upsert({
    where: {
      userOneId_userTwoId: {
        userOneId: sortedIds[0],
        userTwoId: sortedIds[1],
      },
    },
    update: {},
    create: {
      userOneId: sortedIds[0],
      userTwoId: sortedIds[1],
    },
    select: { id: true },
  });

  const hasMessage = await prisma.message.findFirst({
    where: {
      conversationId: conversation.id,
      authorId: systemUser.id,
    },
    select: { id: true },
  });

  if (!hasMessage) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        authorId: systemUser.id,
        text: "Welkom bij Gear2Go! Goed dat je er bent. Je kunt nu direct berichten sturen, gear plaatsen en veilig huren.",
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "SYSTEM",
      title: "Welkom bij Gear2Go",
      body: "Je hebt een nieuw welkomstbericht in Berichten.",
      data: { conversationId: conversation.id },
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: string; password?: string; displayName?: string | null }
      | null;

    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? "";
    const displayName = body?.displayName?.trim() || null;

    if (!email || !email.includes("@") || password.length < 8) {
      return NextResponse.json(
        { error: "Vul een geldig e-mailadres en wachtwoord (min. 8 tekens) in." },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, createdAt: true, emailVerifiedAt: true },
    });

    if (existing) {
      if (existing.emailVerifiedAt) {
        return NextResponse.json(
          { error: "Dit e-mailadres is al in gebruik." },
          { status: 409 },
        );
      }

      const result = await issueEmailVerification(existing, { cooldownSeconds: 60 });

      if (result.retryAfterSeconds) {
        return NextResponse.json(
          {
            error: `Wacht ${result.retryAfterSeconds}s voordat je opnieuw probeert.`,
            retryAfterSeconds: result.retryAfterSeconds,
          },
          { status: 429 },
        );
      }

      return NextResponse.json({
        user: {
          id: existing.id,
          email: existing.email,
          displayName: existing.displayName,
          createdAt: existing.createdAt,
        },
        requiresEmailVerification: true,
        message: isEmailDeliveryConfigured()
          ? "Je account bestaat al. We hebben opnieuw een verificatiemail gestuurd."
          : "Mailserver niet ingesteld in dev. Gebruik de link hieronder om te bevestigen.",
        verificationUrl: result.verificationUrl ?? null,
      });
    }

    const passwordHash = await hashPassword(password);
    let user: BasicUser;
    try {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName,
        },
        select: { id: true, email: true, displayName: true, createdAt: true },
      });
    } catch (error) {
      console.error("Register failed during user.create:", error);
      throw error;
    }

    // HTTP adapter mode does not support transaction-based nested writes.
    // Create privacy settings in a separate statement.
    try {
      await prisma.privacySettings.create({
        data: { userId: user.id },
      });
    } catch (error) {
      console.error("Register failed during privacySettings.create:", error);
      throw error;
    }

    try {
      await createWelcomeInboxForUser(user);
    } catch (error) {
      console.error("Register warning: failed to seed welcome inbox:", error);
    }

<<<<<<< HEAD
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
      return NextResponse.json(
        { error: "E-mailservice is nog niet correct geconfigureerd. Stel een verified BREVO_SENDER in .env in." },
        { status: 500 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Dit e-mailadres is al in gebruik." },
          { status: 409 },
        );
      }
=======
    return NextResponse.json({ user });
  } catch (error: unknown) {
    const prismaCode =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : typeof error === "object" &&
            error !== null &&
            "code" in error &&
            typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : null;

    if (prismaCode === "P2002") {
      return NextResponse.json(
        { error: "Dit e-mailadres is al in gebruik." },
        { status: 409 },
      );
>>>>>>> 10de1c1 (fix location and ontdekken page)
    }

    console.error("Register failed:", error);

    return NextResponse.json(
      { error: "Registratie tijdelijk niet beschikbaar. Probeer het opnieuw." },
      { status: 500 },
    );
  }
}

