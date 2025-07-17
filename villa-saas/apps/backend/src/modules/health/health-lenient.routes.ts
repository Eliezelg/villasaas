import type { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', async (_request, reply) => {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'unknown',
      redis: 'unknown',
    };

    try {
      // Check database
      await fastify.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch (error) {
      checks.database = 'error';
      checks.status = 'error';
    }

    try {
      // Check Redis (mais ne pas faire échouer le health check)
      await fastify.redis.ping();
      checks.redis = 'ok';
    } catch (error) {
      checks.redis = 'error';
      // NE PAS changer le status global pour Redis
      // checks.status = 'error';
    }

    const statusCode = checks.status === 'ok' ? 200 : 503;
    reply.status(statusCode).send(checks);
  });
}