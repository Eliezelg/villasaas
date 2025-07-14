import { FastifyInstance } from 'fastify'

export async function domainLookupRoutes(fastify: FastifyInstance) {
  // Obtenir les informations de tenant/propriété par domaine
  fastify.get('/api/public/domain-lookup/:domain', async (request, reply) => {
    const { domain } = request.params as { domain: string }
    
    try {
      // Chercher d'abord dans les domaines personnalisés des propriétés
      const property = await fastify.prisma.property.findFirst({
        where: {
          OR: [
            { customDomain: domain },
            { subdomain: domain.split('.')[0] } // Si c'est un sous-domaine
          ],
          status: 'PUBLISHED'
        },
        include: {
          tenant: true
        }
      })
      
      if (property) {
        return reply.send({
          found: true,
          type: 'property',
          property: {
            id: property.id,
            subdomain: property.subdomain,
            customDomain: property.customDomain
          },
          tenant: {
            id: property.tenant.id,
            subdomain: property.tenant.subdomain || property.id // Fallback sur l'ID de la propriété
          }
        })
      }
      
      // Chercher dans les tenants (domaines principaux)
      const tenant = await fastify.prisma.tenant.findFirst({
        where: {
          OR: [
            { customDomain: domain },
            { subdomain: domain.split('.')[0] }
          ],
          isActive: true
        }
      })
      
      if (tenant) {
        return reply.send({
          found: true,
          type: 'tenant',
          tenant: {
            id: tenant.id,
            subdomain: tenant.subdomain
          }
        })
      }
      
      return reply.code(404).send({
        found: false,
        message: 'Domain not found'
      })
      
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: { message: 'Internal server error' }
      })
    }
  })
  
  // Endpoint pour vérifier les redirections
  fastify.get('/api/public/check-redirect/:domain', async (request, reply) => {
    const { domain } = request.params as { domain: string }
    
    try {
      // Vérifier si c'est un sous-domaine qui doit rediriger vers un domaine personnalisé
      const property = await fastify.prisma.property.findFirst({
        where: {
          subdomain: domain.split('.')[0],
          customDomain: {
            not: null
          },
          status: 'PUBLISHED'
        }
      })
      
      if (property && property.customDomain) {
        return reply.send({
          shouldRedirect: true,
          targetDomain: property.customDomain
        })
      }
      
      return reply.send({
        shouldRedirect: false
      })
      
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: { message: 'Internal server error' }
      })
    }
  })
}