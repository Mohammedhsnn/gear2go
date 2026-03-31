import { PrismaClient } from "@/generated/prisma";

declare global {
  var __prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL ontbreekt. Voeg deze toe in .env.local.");
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

