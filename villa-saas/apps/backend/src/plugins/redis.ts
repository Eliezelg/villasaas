import fp from 'fastify-plugin';
import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';

async function redisPlugin(fastify: FastifyInstance): Promise<void> {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on('error', (err) => {
    fastify.log.error(err, 'Redis connection error');
  });

  redis.on('connect', () => {
    fastify.log.info('Redis connected');
  });

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async (server) => {
    await server.redis.quit();
  });
}

export default fp(redisPlugin, {
  name: 'redis',
});