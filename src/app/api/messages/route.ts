import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { getCurrentUser } from "@/lib/auth";
import { createNotificationIfAllowed } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, text, imageBase64 } = await req.json();

    const trimmedText = typeof text === "string" ? text.trim() : "";
    const hasImage = typeof imageBase64 === "string" && imageBase64.startsWith("data:image/");

    if (!conversationId || (!trimmedText && !hasImage)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.userOneId !== user.id && conversation.userTwoId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    let composedText = trimmedText;

    if (hasImage) {
      try {
        const base64Data = imageBase64.replace(/^data:image\/[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        if (buffer.length > 8 * 1024 * 1024) {
          return NextResponse.json({ error: "Afbeelding te groot (max 8MB)." }, { status: 400 });
        }

        const filename = `chat-${conversationId}-${Date.now()}.jpg`;
        const filepath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(filepath, buffer);

        const imageUrl = `/uploads/${filename}`;
        const encodedCaption = encodeURIComponent(trimmedText || "");
        composedText = `__IMG__|url=${imageUrl}|caption=${encodedCaption}`;
      } catch {
        return NextResponse.json({ error: "Afbeelding kon niet worden opgeslagen." }, { status: 500 });
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        text: composedText,
        authorId: user.id,
        conversationId,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const recipientId = conversation.userOneId === user.id ? conversation.userTwoId : conversation.userOneId;

    createNotificationIfAllowed({
      userId: recipientId,
      type: "MESSAGE",
      title: "Nieuw chatbericht",
      body: hasImage ? "Nieuwe foto ontvangen" : composedText.slice(0, 140),
      data: { conversationId },
    }).catch(() => {});

    return NextResponse.json(message);
  } catch (error) {
    console.error("Failed to create message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.userOneId !== user.id && conversation.userTwoId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await prisma.message.updateMany({
      where: {
        conversationId,
        authorId: { not: user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to get messages:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}
