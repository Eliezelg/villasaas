export * from '@prisma/client';
import { PrismaClient } from '@prisma/client';

// Re-export PrismaClient and types
export { PrismaClient };
export type { Prisma } from '@prisma/client';

// Create and export a singleton instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;