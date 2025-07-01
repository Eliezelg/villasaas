import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  // Décorateur pour l'authentification obligatoire
  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        await request.jwtVerify();
        
        // Ajouter le tenantId à la requête pour faciliter l'accès
        request.tenantId = request.user.tenantId;
      } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );

  // Décorateur pour l'authentification optionnelle
  fastify.decorate(
    'authenticateOptional',
    async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
      try {
        if (request.headers.authorization) {
          await request.jwtVerify();
          request.tenantId = request.user.tenantId;
        }
      } catch (err) {
        // Ignorer les erreurs, l'authentification est optionnelle
      }
    }
  );
}

export default fp(authPlugin, {
  name: 'auth',
});