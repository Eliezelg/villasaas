"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingRoutes = pricingRoutes;
const zod_1 = require("zod");
const utils_1 = require("@villa-saas/utils");
const pricing_service_1 = require("../../services/pricing.service");
const calculatePriceSchema = zod_1.z.object({
    propertyId: zod_1.z.string(),
    checkIn: zod_1.z.string().datetime(),
    checkOut: zod_1.z.string().datetime(),
    guests: zod_1.z.number().int().positive(),
});
async function pricingRoutes(fastify) {
    const pricingService = new pricing_service_1.PricingService(fastify.prisma);
    // Calculate price for a stay
    fastify.post('/calculate', {
        preHandler: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                required: ['propertyId', 'checkIn', 'checkOut', 'guests'],
                properties: {
                    propertyId: { type: 'string' },
                    checkIn: { type: 'string', format: 'date-time' },
                    checkOut: { type: 'string', format: 'date-time' },
                    guests: { type: 'integer', minimum: 1 },
                },
            },
        },
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const data = calculatePriceSchema.parse(request.body);
        try {
            const pricing = await pricingService.calculatePrice({
                ...data,
                checkIn: new Date(data.checkIn),
                checkOut: new Date(data.checkOut),
                tenantId,
            });
            reply.send(pricing);
        }
        catch (error) {
            if (error instanceof Error) {
                reply.status(400).send({ error: error.message });
            }
            else {
                reply.status(500).send({ error: 'Failed to calculate price' });
            }
        }
    });
    // Check availability
    fastify.get('/availability', {
        preHandler: [fastify.authenticate],
        schema: {
            querystring: {
                type: 'object',
                required: ['propertyId', 'checkIn', 'checkOut'],
                properties: {
                    propertyId: { type: 'string' },
                    checkIn: { type: 'string', format: 'date' },
                    checkOut: { type: 'string', format: 'date' },
                    excludeBookingId: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { propertyId, checkIn, checkOut, excludeBookingId } = request.query;
        try {
            const available = await pricingService.checkAvailability(propertyId, new Date(checkIn), new Date(checkOut), tenantId, excludeBookingId);
            reply.send({ available });
        }
        catch (error) {
            reply.status(500).send({ error: 'Failed to check availability' });
        }
    });
}
//# sourceMappingURL=pricing.routes.js.map