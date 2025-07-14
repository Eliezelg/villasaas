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

export async function createTenant(prisma: PrismaClient) {
  return prisma.tenant.create({
    data: {
      name: 'Test Tenant',
      email: 'test@example.com',
      phone: '+33123456789',
      companyName: 'Test Company',
      subdomain: 'test',
      isActive: true
    }
  });
}

export async function createUser(prisma: PrismaClient, tenantId: string) {
  return prisma.user.create({
    data: {
      tenantId,
      email: 'user@example.com',
      passwordHash: '$2a$10$K7L1OJ0/Az9H5f/bVqHDsOZZKBgfGVmGe4dB0V1u.GYKqwL1J1Jyu', // password
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true
    }
  });
}

export function generateToken(app: FastifyInstance, payload: { id: string; tenantId: string }) {
  return app.jwt.sign({
    userId: payload.id,
    tenantId: payload.tenantId,
    email: 'test@example.com',
    role: 'OWNER'
  });
}