import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma 7 bắt buộc driver adapter (không còn option `datasourceUrl`).
// DATABASE_URL = pooler (runtime query); DIRECT_URL chỉ dùng cho migrate.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
}

// Singleton: tránh tạo nhiều pool khi dev (tsx watch) / serverless warm-start.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
