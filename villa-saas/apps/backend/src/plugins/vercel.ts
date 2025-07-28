import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { VercelService } from '../services/vercel.service';

declare module 'fastify' {
  interface FastifyInstance {
    vercel: VercelService;
  }
}

export default fp(async function (fastify: FastifyInstance) {
  const vercelService = new VercelService(fastify);
  
  fastify.decorate('vercel', vercelService);
  
  fastify.log.info('Vercel plugin loaded');
});