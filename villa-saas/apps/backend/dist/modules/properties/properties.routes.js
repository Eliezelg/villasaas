"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyRoutes = propertyRoutes;
const zod_1 = require("zod");
const utils_1 = require("@villa-saas/utils");
const property_ai_service_1 = require("../../services/property-ai.service");
const subscription_service_1 = require("../../services/subscription.service");
const createPropertySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    propertyType: zod_1.z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LOFT', 'CHALET', 'BUNGALOW', 'MOBILE_HOME', 'BOAT', 'OTHER']),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
    address: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    postalCode: zod_1.z.string().min(1),
    country: zod_1.z.string().default('FR'),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    bedrooms: zod_1.z.number().int().min(0),
    bathrooms: zod_1.z.number().int().min(0),
    maxGuests: zod_1.z.number().int().min(1),
    surfaceArea: zod_1.z.number().optional(),
    description: zod_1.z.record(zod_1.z.string()),
    basePrice: zod_1.z.number().positive(),
    weekendPremium: zod_1.z.number().optional(),
    cleaningFee: zod_1.z.number().optional(),
    securityDeposit: zod_1.z.number().optional(),
    minNights: zod_1.z.number().int().min(1).default(1),
    checkInTime: zod_1.z.string().default('16:00'),
    checkOutTime: zod_1.z.string().default('11:00'),
    instantBooking: zod_1.z.boolean().default(false),
    amenities: zod_1.z.record(zod_1.z.any()).optional(),
    features: zod_1.z.record(zod_1.z.any()).optional(),
    atmosphere: zod_1.z.record(zod_1.z.any()).optional(),
    proximity: zod_1.z.record(zod_1.z.any()).optional(),
});
async function propertyRoutes(fastify) {
    // List properties
    fastify.get('/', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const properties = await fastify.prisma.property.findMany({
            where: (0, utils_1.createTenantFilter)(tenantId),
            include: {
                _count: {
                    select: {
                        bookings: true,
                        images: true,
                    },
                },
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Si aucune image primaire, prendre la première image
        const propertiesWithImages = await Promise.all(properties.map(async (property) => {
            if (property.images.length === 0 && property._count.images > 0) {
                const firstImage = await fastify.prisma.propertyImage.findFirst({
                    where: { propertyId: property.id },
                    orderBy: { order: 'asc' },
                });
                return {
                    ...property,
                    images: firstImage ? [firstImage] : [],
                };
            }
            return property;
        }));
        reply.send(propertiesWithImages);
    });
    // Get property by ID
    fastify.get('/:id', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const property = await fastify.prisma.property.findFirst({
            where: {
                id,
                ...(0, utils_1.createTenantFilter)(tenantId),
            },
            include: {
                images: {
                    orderBy: { order: 'asc' },
                },
                periods: {
                    where: {
                        endDate: { gte: new Date() },
                        isActive: true,
                    },
                    orderBy: { startDate: 'asc' },
                },
            },
        });
        if (!property) {
            reply.status(404).send({ error: 'Property not found' });
            return;
        }
        reply.send(property);
    });
    // Create property
    fastify.post('/', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const tenantId = (0, utils_1.getTenantId)(request);
            // Vérifier les limites de propriétés selon le plan
            const subscriptionService = (0, subscription_service_1.createSubscriptionService)(fastify.prisma);
            const canCreate = await subscriptionService.canCreateProperty(tenantId);
            if (!canCreate.allowed) {
                return reply.code(403).send({
                    error: 'Property limit reached',
                    message: canCreate.reason || 'You cannot create more properties with your current plan',
                    details: {
                        currentCount: canCreate.currentCount,
                        limit: canCreate.limit,
                        plan: 'none' // TODO: get plan from tenant
                    }
                });
            }
            // Si c'est une propriété supplémentaire payante (plan Standard), l'avertir
            if (canCreate.reason === 'Additional property fee required') {
                // TODO: Implémenter la logique pour ajouter la propriété supplémentaire à l'abonnement Stripe
                fastify.log.info(`Tenant ${tenantId} creating additional property (will be charged extra)`);
            }
            // Validate with Zod inside the handler
            const validation = createPropertySchema.safeParse(request.body);
            if (!validation.success) {
                return reply.code(400).send({ error: validation.error });
            }
            const data = validation.data;
            // Générer un slug unique
            const baseSlug = data.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            let slug = baseSlug;
            let counter = 1;
            while (true) {
                const existing = await fastify.prisma.property.findFirst({
                    where: {
                        slug,
                        tenantId,
                    },
                });
                if (!existing)
                    break;
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            // Préparer les données avec le contenu searchable
            const { features, ...dataWithoutFeatures } = data;
            const propertyData = {
                ...dataWithoutFeatures,
                slug,
                amenities: data.amenities || {},
                atmosphere: data.atmosphere || features || {},
                proximity: data.proximity || {},
            };
            // Générer le contenu searchable
            const searchableContent = property_ai_service_1.PropertyAIService.generateSearchableContent(propertyData);
            const property = await fastify.prisma.property.create({
                data: (0, utils_1.addTenantToData)({
                    ...propertyData,
                    searchableContent,
                }, tenantId),
            });
            // Générer l'embedding après création (async mais on ne bloque pas)
            const embeddingContent = property_ai_service_1.PropertyAIService.prepareEmbeddingContent(propertyData);
            property_ai_service_1.PropertyAIService.generateEmbedding(embeddingContent).then(embedding => {
                // Mettre à jour l'embedding en arrière-plan
                if (embedding.length > 0) {
                    fastify.prisma.property.update({
                        where: { id: property.id },
                        data: { embedding }
                    }).catch(err => {
                        fastify.log.error('Failed to update embedding:', err);
                    });
                }
            });
            reply.status(201).send(property);
        }
        catch (error) {
            fastify.log.error('Error creating property:', error);
            reply.status(500).send({ error: 'Failed to create property' });
        }
    });
    // Update property (PATCH - partial update)
    fastify.patch('/:id', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const data = request.body;
        const property = await fastify.prisma.property.update({
            where: {
                id,
                tenantId,
            },
            data,
        });
        reply.send(property);
    });
    // Update property (PUT - full update)
    fastify.put('/:id', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const data = request.body;
        // For PUT, we should validate the full schema
        const validation = createPropertySchema.partial().safeParse(data);
        if (!validation.success) {
            return reply.code(400).send({ error: validation.error });
        }
        // Handle features field (map to atmosphere if provided)
        const { features, ...dataWithoutFeatures } = validation.data;
        // Prepare update data with proper defaults
        const updateData = {
            ...dataWithoutFeatures,
            // If features is provided, use it for atmosphere, otherwise use atmosphere from data
            atmosphere: validation.data.atmosphere || features || {},
            // Ensure other JSON fields have defaults if not provided
            amenities: validation.data.amenities || {},
            proximity: validation.data.proximity || {},
        };
        // Note: searchableContent generation is handled separately via AI service
        // Only update if explicitly provided
        try {
            const property = await fastify.prisma.property.update({
                where: {
                    id,
                    tenantId,
                },
                data: updateData,
            });
            reply.send(property);
        }
        catch (error) {
            fastify.log.error('Error updating property:', error);
            // Check if property exists
            const exists = await fastify.prisma.property.findFirst({
                where: { id, tenantId }
            });
            if (!exists) {
                return reply.code(404).send({ error: 'Property not found' });
            }
            return reply.code(500).send({
                error: 'Failed to update property',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Delete property
    fastify.delete('/:id', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        // Vérifier s'il y a des réservations actives
        const activeBookings = await fastify.prisma.booking.count({
            where: {
                propertyId: id,
                tenantId,
                status: {
                    in: ['PENDING', 'CONFIRMED'],
                },
                checkOut: {
                    gte: new Date(),
                },
            },
        });
        if (activeBookings > 0) {
            reply.status(400).send({
                error: 'Cannot delete property with active bookings'
            });
            return;
        }
        await fastify.prisma.property.update({
            where: {
                id,
                tenantId,
            },
            data: {
                status: 'ARCHIVED',
            },
        });
        reply.status(204).send();
    });
    // Publish/Unpublish property
    fastify.post('/:id/publish', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const { status } = request.body;
        const property = await fastify.prisma.property.update({
            where: {
                id,
                tenantId,
            },
            data: {
                status,
            },
        });
        reply.send(property);
    });
    // Search properties
    fastify.get('/search', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { city, maxGuests, minPrice, maxPrice, checkIn, checkOut } = request.query;
        const where = {
            tenantId,
            status: 'PUBLISHED',
        };
        if (city) {
            where.city = {
                contains: city,
                mode: 'insensitive',
            };
        }
        if (maxGuests) {
            where.maxGuests = {
                gte: parseInt(maxGuests, 10),
            };
        }
        if (minPrice || maxPrice) {
            where.basePrice = {};
            if (minPrice)
                where.basePrice.gte = parseFloat(minPrice);
            if (maxPrice)
                where.basePrice.lte = parseFloat(maxPrice);
        }
        const properties = await fastify.prisma.property.findMany({
            where,
            include: {
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
                _count: {
                    select: {
                        bookings: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Filter by availability if dates provided
        let availableProperties = properties;
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            availableProperties = [];
            for (const property of properties) {
                const bookings = await fastify.prisma.booking.findMany({
                    where: {
                        propertyId: property.id,
                        status: { in: ['PENDING', 'CONFIRMED'] },
                        OR: [
                            {
                                checkIn: { lte: checkOutDate },
                                checkOut: { gte: checkInDate },
                            },
                        ],
                    },
                });
                if (bookings.length === 0) {
                    availableProperties.push(property);
                }
            }
        }
        reply.send(availableProperties);
    });
}
//# sourceMappingURL=properties.routes.js.map