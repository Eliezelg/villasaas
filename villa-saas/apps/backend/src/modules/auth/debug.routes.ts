import { FastifyInstance } from 'fastify';

export default async function debugRoutes(fastify: FastifyInstance) {
  // Route de debug pour vérifier les cookies
  fastify.get('/debug/cookies', async (request, reply) => {
    const response = {
      cookies: request.cookies,
      headers: {
        cookie: request.headers.cookie,
        origin: request.headers.origin,
        referer: request.headers.referer,
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
      },
    };
    
    reply.send(response);
  });
}