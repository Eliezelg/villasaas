import fp from 'fastify-plugin';
import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';

async function redisPlugin(fastify: FastifyInstance): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  fastify.log.info(`Attempting to connect to Redis at: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`);
  
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      fastify.log.info(`Redis connection attempt ${times}, retrying in ${delay}ms`);
      return delay;
    },
    reconnectOnError: (err) => {
      fastify.log.error(`Redis reconnect on error: ${err.message}`);
      return true;
    }
  });

  redis.on('error', (err) => {
    fastify.log.error(err, 'Redis connection error');
  });

  redis.on('connect', () => {
    fastify.log.info('Redis connected successfully!');
  });

  redis.on('ready', () => {
    fastify.log.info('Redis ready to accept commands');
  });

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async (server) => {
    await server.redis.quit();
  });
}

export default fp(redisPlugin, {
  name: 'redis',
});