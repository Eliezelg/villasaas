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

    // Redis check removed - optional service
    checks.redis = 'not_configured';

    const statusCode = checks.status === 'ok' ? 200 : 503;
    reply.status(statusCode).send(checks);
  });
}