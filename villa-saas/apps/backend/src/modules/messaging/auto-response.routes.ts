import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getTenantId } from '@villa-saas/utils';
import { AutoResponseService } from './auto-response.service';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    'GREETING',
    'AVAILABILITY',
    'PRICING',
    'AMENITIES',
    'CHECK_IN_OUT',
    'LOCATION',
    'BOOKING_CONFIRM',
    'BOOKING_REMINDER',
    'THANK_YOU',
    'FAQ',
    'OUT_OF_OFFICE',
    'CUSTOM',
  ]),
  trigger: z.enum([
    'NEW_CONVERSATION',
    'KEYWORD',
    'TIME_BASED',
    'NO_RESPONSE',
    'BOOKING_CREATED',
    'BOOKING_UPCOMING',
    'AFTER_STAY',
    'MANUAL',
  ]),
  content: z.record(z.string()), // {fr: "...", en: "..."}
  variables: z.array(z.string()).optional(),
  conditions: z.any().optional(),
  priority: z.number().default(0),
  isActive: z.boolean().default(true),
});

const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggers: z.object({
    keywords: z.array(z.string()).optional(),
    time: z.object({
      from: z.string(),
      to: z.string(),
    }).optional(),
  }),
  actions: z.object({
    type: z.enum(['send_template', 'start_chatbot', 'notify_owner']),
    templateId: z.string().optional(),
    delay: z.number().optional(),
  }),
  propertyId: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
});

export async function autoResponseRoutes(fastify: FastifyInstance): Promise<void> {
  const autoResponseService = new AutoResponseService(fastify);

  // Get auto-response config
  fastify.get('/auto-response', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { category, trigger, isActive } = request.query as any;

    const where: any = { tenantId };
    
    if (category) where.category = category;
    if (trigger) where.trigger = trigger;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await fastify.prisma.autoResponseTemplate.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    reply.send({
      templates,
      enabled: true
    });
  });

  // Create auto-response config
  fastify.post('/auto-response', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    getTenantId(request); // Validate tenant
    const { templates, rules } = request.body as any;

    // Simple implementation for now
    reply.send({
      templates: templates || [],
      rules: rules || [],
      enabled: true
    });
  });

  // Get single template
  fastify.get('/auto-response/templates/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };

    const template = await fastify.prisma.autoResponseTemplate.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!template) {
      reply.status(404).send({ error: 'Template not found' });
      return;
    }

    reply.send(template);
  });

  // Create template
  fastify.post('/auto-response/templates', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Vérifier les permissions
    if (!['OWNER', 'ADMIN'].includes(request.user!.role)) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const tenantId = getTenantId(request);
    const validatedData = createTemplateSchema.parse(request.body);

    const template = await fastify.prisma.autoResponseTemplate.create({
      data: {
        ...validatedData,
        tenantId,
      },
    });

    reply.status(201).send(template);
  });

  // Update template
  fastify.patch('/auto-response/templates/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Vérifier les permissions
    if (!['OWNER', 'ADMIN'].includes(request.user!.role)) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    const updates = request.body as any;

    const template = await fastify.prisma.autoResponseTemplate.updateMany({
      where: {
        id,
        tenantId,
      },
      data: updates,
    });

    if (template.count === 0) {
      reply.status(404).send({ error: 'Template not found' });
      return;
    }

    reply.send({ updated: true });
  });

  // Delete template
  fastify.delete('/auto-response/templates/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Vérifier les permissions
    if (!['OWNER', 'ADMIN'].includes(request.user!.role)) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };

    const deleted = await fastify.prisma.autoResponseTemplate.deleteMany({
      where: {
        id,
        tenantId,
      },
    });

    if (deleted.count === 0) {
      reply.status(404).send({ error: 'Template not found' });
      return;
    }

    reply.status(204).send();
  });

  // Get rules
  fastify.get('/auto-response/rules', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { propertyId, isActive } = request.query as any;

    const where: any = { tenantId };
    
    if (propertyId) where.propertyId = propertyId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const rules = await fastify.prisma.autoResponseRule.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    reply.send(rules);
  });

  // Create rule
  fastify.post('/auto-response/rules', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Vérifier les permissions
    if (!['OWNER', 'ADMIN'].includes(request.user!.role)) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const tenantId = getTenantId(request);
    const validatedData = createRuleSchema.parse(request.body);

    // Vérifier que la propriété appartient au tenant si spécifiée
    if (validatedData.propertyId) {
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: validatedData.propertyId,
          tenantId,
        },
      });

      if (!property) {
        reply.status(404).send({ error: 'Property not found' });
        return;
      }
    }

    const rule = await fastify.prisma.autoResponseRule.create({
      data: {
        ...validatedData,
        tenantId,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    reply.status(201).send(rule);
  });

  // Update rule
  fastify.patch('/auto-response/rules/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Vérifier les permissions
    if (!['OWNER', 'ADMIN'].includes(request.user!.role)) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    const updates = request.body as any;

    const rule = await fastify.prisma.autoResponseRule.updateMany({
      where: {
        id,
        tenantId,
      },
      data: updates,
    });

    if (rule.count === 0) {
      reply.status(404).send({ error: 'Rule not found' });
      return;
    }

    reply.send({ updated: true });
  });

  // Delete rule
  fastify.delete('/auto-response/rules/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Vérifier les permissions
    if (!['OWNER', 'ADMIN'].includes(request.user!.role)) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };

    const deleted = await fastify.prisma.autoResponseRule.deleteMany({
      where: {
        id,
        tenantId,
      },
    });

    if (deleted.count === 0) {
      reply.status(404).send({ error: 'Rule not found' });
      return;
    }

    reply.status(204).send();
  });

  // Initialize default templates for new tenant
  fastify.post('/auto-response/initialize', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Vérifier que c'est le OWNER
    if (request.user!.role !== 'OWNER') {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const tenantId = getTenantId(request);

    // Vérifier s'il y a déjà des templates
    const existingCount = await fastify.prisma.autoResponseTemplate.count({
      where: { tenantId },
    });

    if (existingCount > 0) {
      reply.status(400).send({ error: 'Templates already exist' });
      return;
    }

    await autoResponseService.createDefaultTemplates(tenantId);

    reply.send({ message: 'Default templates created successfully' });
  });

  // Get chatbot session status
  fastify.get('/auto-response/chatbot/:conversationId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const tenantId = getTenantId(request);

    // Vérifier que la conversation appartient au tenant
    const conversation = await fastify.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
    });

    if (!conversation) {
      reply.status(404).send({ error: 'Conversation not found' });
      return;
    }

    const session = await fastify.prisma.chatbotSession.findUnique({
      where: { conversationId },
    });

    reply.send({
      active: !!session && !session.handedOff,
      session,
    });
  });

  // Toggle chatbot for conversation
  fastify.post('/auto-response/chatbot/:conversationId/toggle', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const { enabled } = request.body as { enabled: boolean };
    const tenantId = getTenantId(request);

    // Vérifier que la conversation appartient au tenant
    const conversation = await fastify.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
      include: {
        property: {
          select: {
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    if (!conversation) {
      reply.status(404).send({ error: 'Conversation not found' });
      return;
    }

    if (enabled) {
      // Créer ou réactiver la session
      await fastify.prisma.chatbotSession.upsert({
        where: { conversationId },
        create: {
          conversationId,
          context: {
            propertyId: conversation.propertyId,
            property: conversation.property,
          },
          state: 'GREETING',
          language: 'fr',
        },
        update: {
          handedOff: false,
          state: 'GREETING',
        },
      });
    } else {
      // Désactiver le chatbot
      await fastify.prisma.chatbotSession.updateMany({
        where: { conversationId },
        data: { handedOff: true },
      });
    }

    reply.send({ enabled });
  });
}