import fp from 'fastify-plugin';
import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';

async function redisPlugin(fastify: FastifyInstance): Promise<void> {
  // Redis est optionnel - si REDIS_URL n'est pas défini, on skip
  if (!process.env.REDIS_URL) {
    fastify.log.warn('Redis URL not configured - Redis features will be disabled');
    
    // Créer un mock Redis qui ne fait rien
    const mockRedis = {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 0,
      expire: async () => 0,
      ttl: async () => -1,
      quit: async () => 'OK',
    };
    
    fastify.decorate('redis', mockRedis);
    return;
  }

  const redis = new Redis(process.env.REDIS_URL, {
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
    if (process.env.REDIS_URL) {
      await server.redis.quit();
    }
  });
}

export default fp(redisPlugin, {
  name: 'redis',
});