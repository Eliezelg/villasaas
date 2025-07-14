import type { FastifyInstance } from 'fastify';
import { createSubscriptionService } from '../../services/subscription.service';

export async function propertyQuotaRoutes(fastify: FastifyInstance) {
  // Get property quota information
  fastify.get('/properties/quota', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Get property quota information for the current tenant',
      tags: ['properties', 'quota'],
      response: {
        200: {
          type: 'object',
          properties: {
            used: { type: 'number' },
            included: { 
              oneOf: [
                { type: 'number' },
                { type: 'string', enum: ['unlimited'] }
              ]
            },
            additional: { type: 'number' },
            canAdd: { type: 'boolean' },
            requiresPayment: { type: 'boolean' },
            plan: { type: 'string' },
          }
        }
      }
    }
  }, async (request, reply) => {
    const tenantId = request.tenantId;
    
    fastify.log.info(`Getting property quota for tenantId: ${tenantId}`);
    
    if (!tenantId) {
      return reply.code(400).send({ 
        error: 'Tenant ID not found' 
      });
    }
    
    const subscriptionService = createSubscriptionService(fastify.prisma);
    
    try {
      const quota = await subscriptionService.getPropertyQuota(tenantId);
      
      // Ajouter le plan actuel
      const tenant = await fastify.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { subscriptionPlan: true }
      });
      
      return {
        ...quota,
        plan: tenant?.subscriptionPlan || 'none'
      };
    } catch (error) {
      fastify.log.error('Error getting property quota:', error);
      fastify.log.error('Error stack:', (error as Error).stack);
      return reply.code(500).send({ 
        error: 'Failed to get property quota' 
      });
    }
  });
}