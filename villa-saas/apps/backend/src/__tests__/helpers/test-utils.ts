import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';
import { PrismaClient } from '@prisma/client';

let app: FastifyInstance | null = null;

export async function getTestApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildApp({
      logger: false,
    });
  }
  return app;
}

export async function closeTestApp(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
  }
}

export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  const tables = [
    'auditLog',
    'searchQuery',
    'integration',
    'emailTemplate',
    'review',
    'touristTax',
    'blockedPeriod',
    'payment',
    'booking',
    'period',
    'propertyImage',
    'property',
    'session',
    'refreshToken',
    'user',
    'tenant',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

export function createAuthHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}