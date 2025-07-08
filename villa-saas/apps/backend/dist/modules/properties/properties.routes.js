"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyRoutes = propertyRoutes;
const zod_1 = require("zod");
const utils_1 = require("@villa-saas/utils");
const property_ai_service_1 = require("../../services/property-ai.service");
const createPropertySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    propertyType: zod_1.z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LOFT', 'CHALET', 'BUNGALOW', 'MOBILE_HOME', 'BOAT', 'OTHER']),
    address: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    postalCode: zod_1.z.string().min(1),
    country: zod_1.z.string().default('FR'),
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
        schema: {
            body: {
                type: 'object',
                required: ['name', 'propertyType', 'address', 'city', 'postalCode', 'bedrooms', 'bathrooms', 'maxGuests', 'description', 'basePrice'],
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    propertyType: { type: 'string', enum: ['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LOFT', 'CHALET', 'BUNGALOW', 'MOBILE_HOME', 'BOAT', 'OTHER'] },
                    address: { type: 'string', minLength: 1 },
                    city: { type: 'string', minLength: 1 },
                    postalCode: { type: 'string', minLength: 1 },
                    country: { type: 'string' },
                    bedrooms: { type: 'integer', minimum: 0 },
                    bathrooms: { type: 'integer', minimum: 0 },
                    maxGuests: { type: 'integer', minimum: 1 },
                    surfaceArea: { type: 'number' },
                    description: { type: 'object' },
                    basePrice: { type: 'number', minimum: 0 },
                    weekendPremium: { type: 'number' },
                    cleaningFee: { type: 'number' },
                    securityDeposit: { type: 'number' },
                    minNights: { type: 'integer', minimum: 1 },
                    checkInTime: { type: 'string' },
                    checkOutTime: { type: 'string' },
                    instantBooking: { type: 'boolean' },
                },
            },
        },
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const data = request.body;
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
        const propertyData = {
            ...data,
            slug,
            amenities: data.amenities || {},
            atmosphere: data.atmosphere || {},
            proximity: data.proximity || {},
        };
        // Générer le contenu searchable
        const searchableContent = property_ai_service_1.PropertyAIService.generateSearchableContent(propertyData);
        // Générer l'embedding (async mais on ne bloque pas)
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
        const property = await fastify.prisma.property.create({
            data: (0, utils_1.addTenantToData)({
                ...propertyData,
                searchableContent,
            }, tenantId),
        });
        reply.status(201).send(property);
    });
    // Update property
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
}
//# sourceMappingURL=properties.routes.js.map