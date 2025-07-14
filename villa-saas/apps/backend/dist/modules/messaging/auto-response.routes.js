"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoResponseRoutes = autoResponseRoutes;
const zod_1 = require("zod");
const utils_1 = require("@villa-saas/utils");
const auto_response_service_1 = require("./auto-response.service");
const createTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    category: zod_1.z.enum([
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
    trigger: zod_1.z.enum([
        'NEW_CONVERSATION',
        'KEYWORD',
        'TIME_BASED',
        'NO_RESPONSE',
        'BOOKING_CREATED',
        'BOOKING_UPCOMING',
        'AFTER_STAY',
        'MANUAL',
    ]),
    content: zod_1.z.record(zod_1.z.string()), // {fr: "...", en: "..."}
    variables: zod_1.z.array(zod_1.z.string()).optional(),
    conditions: zod_1.z.any().optional(),
    priority: zod_1.z.number().default(0),
    isActive: zod_1.z.boolean().default(true),
});
const createRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    triggers: zod_1.z.object({
        keywords: zod_1.z.array(zod_1.z.string()).optional(),
        time: zod_1.z.object({
            from: zod_1.z.string(),
            to: zod_1.z.string(),
        }).optional(),
    }),
    actions: zod_1.z.object({
        type: zod_1.z.enum(['send_template', 'start_chatbot', 'notify_owner']),
        templateId: zod_1.z.string().optional(),
        delay: zod_1.z.number().optional(),
    }),
    propertyId: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
    priority: zod_1.z.number().default(0),
});
async function autoResponseRoutes(fastify) {
    const autoResponseService = new auto_response_service_1.AutoResponseService(fastify);
    // Get auto-response config
    fastify.get('/auto-response', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { category, trigger, isActive } = request.query;
        const where = { tenantId };
        if (category)
            where.category = category;
        if (trigger)
            where.trigger = trigger;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
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
        (0, utils_1.getTenantId)(request); // Validate tenant
        const { templates, rules } = request.body;
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
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
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
        if (!['OWNER', 'ADMIN'].includes(request.user.role)) {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_1.getTenantId)(request);
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
        if (!['OWNER', 'ADMIN'].includes(request.user.role)) {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const updates = request.body;
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
        if (!['OWNER', 'ADMIN'].includes(request.user.role)) {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
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
        const tenantId = (0, utils_1.getTenantId)(request);
        const { propertyId, isActive } = request.query;
        const where = { tenantId };
        if (propertyId)
            where.propertyId = propertyId;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
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
        if (!['OWNER', 'ADMIN'].includes(request.user.role)) {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_1.getTenantId)(request);
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
        if (!['OWNER', 'ADMIN'].includes(request.user.role)) {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const updates = request.body;
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
        if (!['OWNER', 'ADMIN'].includes(request.user.role)) {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
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
        if (request.user.role !== 'OWNER') {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_1.getTenantId)(request);
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
        const { conversationId } = request.params;
        const tenantId = (0, utils_1.getTenantId)(request);
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
        const { conversationId } = request.params;
        const { enabled } = request.body;
        const tenantId = (0, utils_1.getTenantId)(request);
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
        }
        else {
            // Désactiver le chatbot
            await fastify.prisma.chatbotSession.updateMany({
                where: { conversationId },
                data: { handedOff: true },
            });
        }
        reply.send({ enabled });
    });
}
//# sourceMappingURL=auto-response.routes.js.map