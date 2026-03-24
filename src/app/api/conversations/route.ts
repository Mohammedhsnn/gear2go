import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all conversations for the user
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userOneId: user.id },
          { userTwoId: user.id },
        ],
      },
      include: {
        userOne: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        item: {
          select: {
            id: true,
            title: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            text: true,
            createdAt: true,
            authorId: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Failed to get conversations:", error);
    return NextResponse.json(
      { error: "Failed to get conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      otherUserId,
      itemId,
      bookingId,
    } = await req.json();

    if (!otherUserId) {
      return NextResponse.json(
        { error: "otherUserId is required" },
        { status: 400 }
      );
    }

    if (otherUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existing = await prisma.conversation.findUnique({
      where: {
        userOneId_userTwoId: {
          userOneId: [user.id, otherUserId].sort()[0],
          userTwoId: [user.id, otherUserId].sort()[1],
        },
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create new conversation
    const sortedIds = [user.id, otherUserId].sort();
    const conversation = await prisma.conversation.create({
      data: {
        userOneId: sortedIds[0],
        userTwoId: sortedIds[1],
        itemId,
        bookingId,
      },
      include: {
        userOne: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
