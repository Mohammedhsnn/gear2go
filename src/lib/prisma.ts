import { PrismaClient } from "@/generated/prisma";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

declare global {
  var __prisma: PrismaClient | undefined;
}

const fallbackDatasourceUrl = "postgresql://user:pass@localhost:5432/db?schema=public";
const adapter = new PrismaNeonHttp(
  process.env.DATABASE_URL || fallbackDatasourceUrl,
  {},
);

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({ adapter });

// Note: Prisma CLI reads DATABASE_URL via prisma.config.ts.
// Runtime passes datasourceUrl explicitly (Prisma v7).

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

