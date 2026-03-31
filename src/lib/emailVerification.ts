import { newToken, sha256Hex } from "@/lib/auth";
import { isEmailDeliveryConfigured, sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

type VerificationUser = {
  id: string;
  email: string;
  displayName: string | null;
};

type IssueOptions = {
  cooldownSeconds?: number;
  maxPerHour?: number;
};

type IssueResult = {
  verificationUrl?: string;
  retryAfterSeconds?: number;
};

export async function issueEmailVerification(
  user: VerificationUser,
  options: IssueOptions = {},
): Promise<IssueResult> {
  const cooldownSeconds = options.cooldownSeconds ?? 60;
  const maxPerHour = options.maxPerHour ?? 5;
  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);

  if (maxPerHour > 0) {
    const countLastHour = await prisma.verificationToken.count({
      where: {
        userId: user.id,
        type: "EMAIL",
        createdAt: { gte: oneHourAgo },
      },
    });

    if (countLastHour >= maxPerHour) {
      const oldestInWindow = await prisma.verificationToken.findFirst({
        where: {
          userId: user.id,
          type: "EMAIL",
          createdAt: { gte: oneHourAgo },
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });

      const retryAfterSeconds = oldestInWindow
        ? Math.max(1, Math.ceil((oldestInWindow.createdAt.getTime() + 60 * 60 * 1000 - now) / 1000))
        : 60;

      return { retryAfterSeconds };
    }
  }

  const latest = await prisma.verificationToken.findFirst({
    where: {
      userId: user.id,
      type: "EMAIL",
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (latest) {
    const elapsed = Math.floor((now - latest.createdAt.getTime()) / 1000);
    const remaining = cooldownSeconds - elapsed;
    if (remaining > 0) {
      return { retryAfterSeconds: remaining };
    }
  }

  const rawToken = newToken();
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}`;

  await prisma.verificationToken.updateMany({
    where: {
      userId: user.id,
      type: "EMAIL",
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      type: "EMAIL",
      tokenHash,
      expiresAt,
    },
  });

  if (isEmailDeliveryConfigured()) {
    try {
      await sendVerificationEmail({
        to: user.email,
        displayName: user.displayName,
        verificationUrl,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
      console.error("Email delivery failed in dev, fallback to verification URL:", error);
    }

    if (process.env.NODE_ENV !== "production") {
      return { verificationUrl };
    }

    return {};
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("EMAIL_DELIVERY_NOT_CONFIGURED");
  }

  return { verificationUrl };
}
