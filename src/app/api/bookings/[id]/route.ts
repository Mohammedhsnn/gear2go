import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createNotificationIfAllowed } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | {
        decision?: "accept" | "decline";
      }
    | null;

  const decision = body?.decision;
  if (!decision || (decision !== "accept" && decision !== "decline")) {
    return NextResponse.json({ error: "decision moet 'accept' of 'decline' zijn." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      item: { select: { title: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: "Boeking niet gevonden." }, { status: 404 });
  if (booking.ownerId !== user.id) {
    return NextResponse.json({ error: "Alleen de verhuurder kan beslissen." }, { status: 403 });
  }
  if (booking.status !== "REQUESTED") {
    return NextResponse.json({ error: "Alleen aangevraagde boekingen kunnen aangepast worden." }, { status: 409 });
  }

  const nextStatus = decision === "accept" ? "CONFIRMED" : "DECLINED";

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: nextStatus },
    include: {
      item: { select: { id: true, title: true } },
      renter: { select: { id: true, displayName: true, email: true } },
      owner: { select: { id: true, displayName: true, email: true } },
    },
  });

  await createNotificationIfAllowed({
    userId: booking.renterId,
    type: "ITEM",
    title: decision === "accept" ? "Boeking bevestigd" : "Boeking geweigerd",
    body:
      decision === "accept"
        ? `Je aanvraag voor ${booking.item.title} is bevestigd.`
        : `Je aanvraag voor ${booking.item.title} is geweigerd.`,
    data: { bookingId: booking.id, status: updated.status },
  });

  return NextResponse.json({ booking: updated });
}
