import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { swaggerTags } from '../../utils/swagger-schemas';
import { requirePermission } from '../../middleware/rbac.middleware';

const createDNSRecordSchema = z.object({
  subdomain: z.string().min(1),
  target: z.string().optional(), // Par défaut '@' (domaine principal)
});

const updateDNSRecordSchema = z.object({
  recordId: z.string().min(1),
  target: z.string().optional(),
  proxied: z.boolean().optional(),
});

const deleteDNSRecordSchema = z.object({
  recordId: z.string().min(1),
});

export async function dnsManagementRoutes(fastify: FastifyInstance) {
  // Créer un enregistrement DNS
  fastify.post('/dns/records', {
    schema: {
      tags: [swaggerTags.domains],
      summary: 'Créer un enregistrement DNS',
      description: 'Crée automatiquement un enregistrement DNS dans Cloudflare',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['subdomain'],
        properties: {
          subdomain: { type: 'string' },
          target: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            record: { type: 'object' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate, requirePermission('domain.create')],
  }, async (request, reply) => {
    const validation = createDNSRecordSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { subdomain, target } = validation.data;

    if (!fastify.cloudflare) {
      return reply.code(503).send({ 
        error: 'Cloudflare non configuré',
        message: 'La gestion automatique des DNS n\'est pas disponible'
      });
    }

    try {
      const record = await fastify.cloudflare.createSubdomainRecord(subdomain, target);
      
      reply.send({
        success: true,
        record,
      });
    } catch (error: any) {
      fastify.log.error('Error creating DNS record:', error);
      reply.code(500).send({ 
        error: 'Erreur lors de la création de l\'enregistrement DNS',
        details: error.message,
      });
    }
  });

  // Vérifier un enregistrement DNS
  fastify.get('/dns/records/:subdomain', {
    schema: {
      tags: [swaggerTags.domains],
      summary: 'Vérifier un enregistrement DNS',
      description: 'Vérifie l\'existence d\'un enregistrement DNS',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['subdomain'],
        properties: {
          subdomain: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
            record: { type: 'object' },
            sslStatus: { type: 'object' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };

    if (!fastify.cloudflare) {
      return reply.code(503).send({ 
        error: 'Cloudflare non configuré',
        message: 'La gestion automatique des DNS n\'est pas disponible'
      });
    }

    try {
      const record = await fastify.cloudflare.getSubdomainRecord(subdomain);
      const sslStatus = await fastify.cloudflare.checkSSLStatus(
        `${subdomain}.${process.env.CLOUDFLARE_DOMAIN || 'webpro200.com'}`
      );
      
      reply.send({
        exists: !!record,
        record,
        sslStatus,
      });
    } catch (error: any) {
      fastify.log.error('Error checking DNS record:', error);
      reply.code(500).send({ 
        error: 'Erreur lors de la vérification de l\'enregistrement DNS',
        details: error.message,
      });
    }
  });

  // Mettre à jour un enregistrement DNS
  fastify.patch('/dns/records', {
    schema: {
      tags: [swaggerTags.domains],
      summary: 'Mettre à jour un enregistrement DNS',
      description: 'Met à jour un enregistrement DNS existant',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['recordId'],
        properties: {
          recordId: { type: 'string' },
          target: { type: 'string' },
          proxied: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            record: { type: 'object' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate, requirePermission('domain.update')],
  }, async (request, reply) => {
    const validation = updateDNSRecordSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { recordId, ...updates } = validation.data;

    if (!fastify.cloudflare) {
      return reply.code(503).send({ 
        error: 'Cloudflare non configuré',
        message: 'La gestion automatique des DNS n\'est pas disponible'
      });
    }

    try {
      const record = await fastify.cloudflare.updateSubdomainRecord(recordId, updates);
      
      reply.send({
        success: true,
        record,
      });
    } catch (error: any) {
      fastify.log.error('Error updating DNS record:', error);
      reply.code(500).send({ 
        error: 'Erreur lors de la mise à jour de l\'enregistrement DNS',
        details: error.message,
      });
    }
  });

  // Supprimer un enregistrement DNS
  fastify.delete('/dns/records', {
    schema: {
      tags: [swaggerTags.domains],
      summary: 'Supprimer un enregistrement DNS',
      description: 'Supprime un enregistrement DNS',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['recordId'],
        properties: {
          recordId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate, requirePermission('domain.delete')],
  }, async (request, reply) => {
    const validation = deleteDNSRecordSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { recordId } = validation.data;

    if (!fastify.cloudflare) {
      return reply.code(503).send({ 
        error: 'Cloudflare non configuré',
        message: 'La gestion automatique des DNS n\'est pas disponible'
      });
    }

    try {
      await fastify.cloudflare.deleteSubdomainRecord(recordId);
      
      reply.send({
        success: true,
      });
    } catch (error: any) {
      fastify.log.error('Error deleting DNS record:', error);
      reply.code(500).send({ 
        error: 'Erreur lors de la suppression de l\'enregistrement DNS',
        details: error.message,
      });
    }
  });

  // Purger le cache Cloudflare
  fastify.post('/dns/cache/purge', {
    schema: {
      tags: [swaggerTags.domains],
      summary: 'Purger le cache Cloudflare',
      description: 'Purge le cache Cloudflare pour un sous-domaine',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['subdomain'],
        properties: {
          subdomain: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { subdomain } = request.body as { subdomain: string };

    if (!fastify.cloudflare) {
      return reply.code(503).send({ 
        error: 'Cloudflare non configuré',
        message: 'La gestion automatique des DNS n\'est pas disponible'
      });
    }

    try {
      await fastify.cloudflare.purgeCache(subdomain);
      
      reply.send({
        success: true,
      });
    } catch (error: any) {
      fastify.log.error('Error purging cache:', error);
      reply.code(500).send({ 
        error: 'Erreur lors de la purge du cache',
        details: error.message,
      });
    }
  });
}