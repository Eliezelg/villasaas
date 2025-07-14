import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  // Décorateur pour l'authentification obligatoire
  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        // Vérifier d'abord le cookie, puis le header Authorization
        let token: string | undefined;
        
        // Essayer de récupérer le token depuis le cookie
        if (request.cookies && request.cookies.access_token) {
          token = request.cookies.access_token;
        }
        // Sinon, essayer depuis le header Authorization
        else if (request.headers.authorization) {
          const parts = request.headers.authorization.split(' ');
          if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
          }
        }
        
        if (!token) {
          throw new Error('No token provided');
        }
        
        // Vérifier le token
        const decoded = await fastify.jwt.verify(token) as { userId: string; tenantId: string; email: string; role: string; permissions: string[] };
        request.user = decoded;
        
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
        let token: string | undefined;
        
        // Essayer de récupérer le token depuis le cookie
        if (request.cookies && request.cookies.access_token) {
          token = request.cookies.access_token;
        }
        // Sinon, essayer depuis le header Authorization
        else if (request.headers.authorization) {
          const parts = request.headers.authorization.split(' ');
          if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
          }
        }
        
        if (token) {
          const decoded = await fastify.jwt.verify(token) as { userId: string; tenantId: string; email: string; role: string; permissions: string[] };
          request.user = decoded;
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