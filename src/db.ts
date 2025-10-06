import { Prisma, PrismaClient } from './generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate';

const base = new PrismaClient({
  log: ['query', 'error', 'warn'],
}).$extends(withAccelerate());

type ExtendedPrismaClient = typeof base;

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

export const db: ExtendedPrismaClient = globalForPrisma.prisma ?? base;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;