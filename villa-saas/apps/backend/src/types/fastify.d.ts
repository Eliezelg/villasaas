import 'fastify';
import type { JWT } from '@fastify/jwt';
import type { PrismaClient } from '@villa-saas/database';
import type { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    jwt: JWT;
    prisma: PrismaClient;
    redis: Redis;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateOptional: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      userId: string;
      tenantId: string;
      email: string;
      role: string;
      permissions: string[];
    };
    tenantId?: string;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      tenantId: string;
      email: string;
      role: string;
      permissions: string[];
    };
    user: {
      userId: string;
      tenantId: string;
      email: string;
      role: string;
      permissions: string[];
    };
  }
}