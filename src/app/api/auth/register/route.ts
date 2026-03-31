import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const passwordHash = await hashPassword(password);
    let user: { id: string; email: string; displayName: string | null; createdAt: Date };
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
      await createSession(user.id);
    } catch (error) {
      console.error("Register failed during createSession:", error);
      throw error;
    }

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
    }

    console.error("Register failed:", error);

    return NextResponse.json(
      { error: "Registratie tijdelijk niet beschikbaar. Probeer het opnieuw." },
      { status: 500 },
    );
  }
}

