import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Inloggen vereist" }, { status: 401 });
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json(userData);
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Inloggen vereist" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    displayName?: string;
    avatarUrl?: string;
    avatarBase64?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Leeg verzoek" }, { status: 400 });
  }

  const displayName = body.displayName?.trim() || null;
  let avatarUrl = body.avatarUrl?.trim() || null;

  if (displayName && displayName.length < 2) {
    return NextResponse.json({ error: "Naam moet minimaal 2 tekens zijn" }, { status: 400 });
  }

  // Handle base64 avatar upload
  if (body.avatarBase64) {
    try {
      const base64Data = body.avatarBase64.replace(/^data:image\/[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      // Validate it's a reasonable image size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Foto is te groot (max 5MB)" }, { status: 400 });
      }

      // Generate filename
      const filename = `avatar-${user.id}-${Date.now()}.jpg`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Save file
      fs.writeFileSync(filepath, buffer);
      
      // Delete old avatar if it exists (cleanup)
      if (user.avatarUrl && user.avatarUrl.includes("/uploads/avatar-")) {
        try {
          const oldFilename = user.avatarUrl.split("/").pop();
          if (oldFilename) {
            fs.unlinkSync(path.join(UPLOAD_DIR, oldFilename));
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      avatarUrl = `/uploads/${filename}`;
    } catch (err) {
      console.error("Failed to save avatar:", err);
      return NextResponse.json({ error: "Kon foto niet opslaan" }, { status: 500 });
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return NextResponse.json({ error: "Kon instellingen niet opslaan" }, { status: 500 });
  }
}
