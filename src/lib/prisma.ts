import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL: la app no puede conectarse a la base.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// En dev, Next.js recarga los módulos en cada cambio: sin este singleton se
// abrirían conexiones nuevas en cada HMR hasta agotar el pool.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
