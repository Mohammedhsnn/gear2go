import { NextResponse } from "next/server";
import { issueEmailVerification } from "@/lib/emailVerification";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { consumeIpRateLimit } from "@/lib/ipRateLimit";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: string } | null;
    const email = body?.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Vul een geldig e-mailadres in." }, { status: 400 });
    }

    const forwarded = req.headers.get("x-forwarded-for") || "";
    const clientIp = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const ipLimitKey = `resend:${clientIp}`;
    const ipLimit = consumeIpRateLimit(ipLimitKey, 5, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Te veel verzoeken vanaf dit IP. Probeer opnieuw over ${ipLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerifiedAt: true,
      },
    });

    // Avoid account enumeration by returning a generic success response.
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "Als dit account bestaat, is er een verificatiemail verstuurd.",
      });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({
        ok: true,
        message: "Dit e-mailadres is al bevestigd. Je kunt inloggen.",
      });
    }

    const result = await issueEmailVerification(user, {
      cooldownSeconds: 60,
      maxPerHour: 5,
    });

    if (result.retryAfterSeconds) {
      return NextResponse.json(
        {
          error: `Limiet bereikt. Wacht ${result.retryAfterSeconds}s voordat je opnieuw een mail aanvraagt.`,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: isEmailDeliveryConfigured()
        ? "Verificatiemail verstuurd. Check je inbox."
        : "Mailserver niet ingesteld in dev. Gebruik de verificatielink hieronder.",
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

    console.error("Resend verification failed:", error);
    return NextResponse.json(
      { error: "Verificatiemail versturen is tijdelijk niet beschikbaar." },
      { status: 500 },
    );
  }
}
