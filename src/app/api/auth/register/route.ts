import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@/generated/prisma";
import { hashPassword } from "@/lib/auth";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { issueEmailVerification } from "@/lib/emailVerification";
import { resolveAddressToPoint } from "@/lib/location";
import { createNotificationIfAllowed } from "@/lib/notifications";
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

  await createNotificationIfAllowed({
    userId: user.id,
    type: "SYSTEM",
    title: "Welkom bij Gear2Go",
    body: "Je hebt een nieuw welkomstbericht in Berichten.",
    data: { conversationId: conversation.id },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          email?: string;
          password?: string;
          displayName?: string | null;
          homeAddress?: string | null;
          homeLat?: number | null;
          homeLng?: number | null;
        }
      | null;

    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? "";
    const displayName = body?.displayName?.trim() || null;
    const homeAddress = body?.homeAddress?.trim() || "";
    const providedHomeLat = typeof body?.homeLat === "number" ? body.homeLat : null;
    const providedHomeLng = typeof body?.homeLng === "number" ? body.homeLng : null;

    let homeLat = Number.isFinite(providedHomeLat) ? providedHomeLat : null;
    let homeLng = Number.isFinite(providedHomeLng) ? providedHomeLng : null;

    if (!homeAddress) {
      return NextResponse.json({ error: "Voeg je thuisadres toe om een account te maken." }, { status: 400 });
    }

    if (homeLat == null || homeLng == null) {
      const resolved = await resolveAddressToPoint(homeAddress);
      if (resolved) {
        homeLat = resolved.lat;
        homeLng = resolved.lng;
      }
    }

    if (homeLat == null || homeLng == null) {
      return NextResponse.json({ error: "Voer een geldige locatie in en kies een suggestie uit de lijst." }, { status: 400 });
    }
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
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          displayName,
          homeAddress,
          homeLat,
          homeLng,
        },
      });

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
        user: { id: existing.id, email: existing.email, displayName: existing.displayName, createdAt: existing.createdAt },
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
          homeAddress,
          homeLat,
          homeLng,
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
        return NextResponse.json({ error: "Dit e-mailadres is al in gebruik." }, { status: 409 });
      }
    }

    console.error("Register failed:", error);

    return NextResponse.json({ error: "Registratie tijdelijk niet beschikbaar. Probeer het opnieuw." }, { status: 500 });
  }
}
