import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const updatePublicSiteSchema = z.object({
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/).optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
    borderRadius: z.string().optional(),
  }).optional(),
  metadata: z.any().optional(),
  isActive: z.boolean().optional(),
});

export async function publicSiteRoutes(fastify: FastifyInstance) {
  // Récupérer le PublicSite du tenant actuel
  fastify.get('/public-site', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Récupérer la configuration du site public',
      tags: ['public-site'],
    }
  }, async (request, reply) => {
    const { tenantId } = request;

    try {
      const publicSite = await fastify.prisma.publicSite.findUnique({
        where: { tenantId: tenantId! },
        select: {
          id: true,
          domain: true,
          subdomain: true,
          isActive: true,
          theme: true,
          metadata: true,
          defaultLocale: true,
          locales: true,
          createdAt: true,
        }
      });

      if (!publicSite) {
        return reply.code(404).send({ 
          error: 'PublicSite not found' 
        });
      }

      return publicSite;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to retrieve public site configuration' 
      });
    }
  });

  // Mettre à jour le PublicSite
  fastify.patch('/public-site', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Mettre à jour la configuration du site public',
      tags: ['public-site'],
    }
  }, async (request, reply) => {
    const validation = updatePublicSiteSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { tenantId, user } = request;
    const data = validation.data;

    try {
      // Vérifier que l'utilisateur est OWNER ou ADMIN
      if (user?.role !== 'OWNER' && user?.role !== 'ADMIN') {
        return reply.code(403).send({ 
          error: 'Insufficient permissions' 
        });
      }

      // Vérifier si le domaine est déjà utilisé par un autre tenant
      if (data.domain) {
        const existingDomain = await fastify.prisma.publicSite.findFirst({
          where: {
            domain: data.domain,
            NOT: { tenantId: tenantId! }
          }
        });

        if (existingDomain) {
          return reply.code(400).send({ 
            error: 'Domain already in use' 
          });
        }
      }

      // Mettre à jour le PublicSite
      const publicSite = await fastify.prisma.publicSite.update({
        where: { tenantId: tenantId! },
        data: {
          ...(data.domain !== undefined && { domain: data.domain }),
          ...(data.theme && { theme: data.theme }),
          ...(data.metadata && { metadata: data.metadata }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        select: {
          id: true,
          domain: true,
          subdomain: true,
          isActive: true,
          theme: true,
          metadata: true,
          defaultLocale: true,
          locales: true,
        }
      });

      // Si un domaine a été ajouté/modifié, l'ajouter à Vercel
      if (data.domain && fastify.vercel) {
        const vercelResult = await fastify.vercel.addDomain(data.domain);
        if (!vercelResult.success) {
          fastify.log.warn('Failed to add domain to Vercel', { 
            domain: data.domain, 
            error: vercelResult.error 
          });
        }
      }

      // Log de l'audit
      await fastify.prisma.auditLog.create({
        data: {
          tenantId: tenantId!,
          userId: user?.userId || '',
          action: 'public_site.updated',
          entity: 'public_site',
          entityId: publicSite.id,
          details: data,
        }
      });

      return publicSite;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to update public site configuration' 
      });
    }
  });

  // Vérifier la disponibilité d'un domaine
  fastify.get('/public-site/check-domain', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Vérifier la disponibilité d\'un domaine',
      tags: ['public-site'],
      querystring: {
        type: 'object',
        properties: {
          domain: { type: 'string' }
        },
        required: ['domain']
      }
    }
  }, async (request, reply) => {
    const { domain } = request.query as { domain: string };
    const { tenantId } = request;

    try {
      const existing = await fastify.prisma.publicSite.findFirst({
        where: {
          domain,
          NOT: { tenantId: tenantId! }
        }
      });

      return {
        available: !existing,
        domain
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to check domain availability' 
      });
    }
  });

  // Vérifier le statut d'un domaine sur Vercel
  fastify.get('/public-site/domain-status', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Vérifier le statut d\'un domaine sur Vercel',
      tags: ['public-site'],
      querystring: {
        type: 'object',
        properties: {
          domain: { type: 'string' }
        },
        required: ['domain']
      }
    }
  }, async (request, reply) => {
    const { domain } = request.query as { domain: string };

    try {
      if (!fastify.vercel) {
        return {
          configured: false,
          verified: false,
          dns: [],
          error: 'Vercel integration not configured'
        };
      }

      // Vérifier le statut sur Vercel
      const status = await fastify.vercel.checkDomain(domain);
      
      // Récupérer la configuration DNS si le domaine n'est pas vérifié
      let dnsConfig: { records: Array<{ type: string; name: string; value: string }> } = { records: [] };
      if (!status.verified) {
        dnsConfig = await fastify.vercel.getDnsConfiguration(domain);
      }

      return {
        ...status,
        dns: dnsConfig.records
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to check domain status' 
      });
    }
  });
}