import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId: string;
  type: "SYSTEM" | "ITEM" | "REVIEW" | "MESSAGE" | "SECURITY";
  title: string;
  body?: string | null;
  data?: unknown;
};

export async function createNotificationIfAllowed(input: NotificationInput): Promise<void> {
  const privacy = await prisma.privacySettings.findUnique({
    where: { userId: input.userId },
    select: { pushNotifications: true },
  });

  if (privacy && privacy.pushNotifications === false) {
    return;
  }

  const notificationData =
    input.data === undefined
      ? undefined
      : input.data === null
        ? Prisma.JsonNull
        : (input.data as Prisma.InputJsonValue);

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      data: notificationData,
    },
  });
}
