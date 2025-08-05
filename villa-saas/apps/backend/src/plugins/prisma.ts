import fp from 'fastify-plugin';
import { PrismaClient } from '@villa-saas/database';
import type { FastifyInstance } from 'fastify';

async function prismaPlugin(fastify: FastifyInstance): Promise<void> {
  const prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Middleware pour le multi-tenancy automatique
  prisma.$use(async (params: any, next: any) => {
    // Ne pas appliquer sur les modèles qui n'ont pas de tenantId
    const modelsWithoutTenant = ['RefreshToken', 'Session'];
    
    if (params.model && !modelsWithoutTenant.includes(params.model)) {
      // Pour les opérations de lecture
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        if (params.args.where && params.args.where.tenantId === undefined) {
          // Le tenantId sera ajouté par le code appelant
        }
      } else if (params.action === 'findMany') {
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};
        // Le tenantId sera ajouté par le code appelant
      }
      
      // Pour les opérations de création
      if (params.action === 'create') {
        if (!params.args.data.tenantId) {
          // Le tenantId sera ajouté par le code appelant
        }
      }
    }

    return next(params);
  });

  // Connexion avec retry
  let retries = 3;
  while (retries > 0) {
    try {
      await prisma.$connect();
      fastify.log.info('Successfully connected to database');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        fastify.log.error('Failed to connect to database after 3 attempts');
        fastify.log.error('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@'));
        throw error;
      }
      fastify.log.warn(`Database connection failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
}

export default fp(prismaPlugin, {
  name: 'prisma',
});