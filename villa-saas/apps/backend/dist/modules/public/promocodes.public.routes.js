"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicPromoCodesRoutes = void 0;
const zod_1 = require("zod");
const promocode_service_1 = require("../../services/promocode.service");
const validatePromoCodeSchema = zod_1.z.object({
    code: zod_1.z.string().toUpperCase(),
    propertyId: zod_1.z.string(),
    checkIn: zod_1.z.string().datetime(),
    checkOut: zod_1.z.string().datetime(),
    totalAmount: zod_1.z.number().positive(),
    nights: zod_1.z.number().positive(),
});
const publicPromoCodesRoutes = async (fastify) => {
    // Valider un code promo publiquement
    fastify.post('/public/promocodes/validate', {
        schema: {
            description: 'Valider un code promo',
            tags: ['public'],
        }
    }, async (request, reply) => {
        const validation = validatePromoCodeSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.code(400).send({ error: validation.error });
        }
        // Check for tenant in header or query params
        const tenantSubdomain = request.headers['x-tenant'] || request.query.tenantId;
        if (!tenantSubdomain) {
            return reply.code(400).send({ error: 'Tenant not specified' });
        }
        try {
            const tenant = await fastify.prisma.tenant.findFirst({
                where: { subdomain: tenantSubdomain }
            });
            if (!tenant) {
                return reply.code(404).send({ error: 'Tenant not found' });
            }
            const { code, propertyId, checkIn, checkOut, totalAmount, nights } = validation.data;
            const result = await (0, promocode_service_1.validatePromoCode)(fastify.prisma, {
                code,
                tenantId: tenant.id,
                propertyId,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                totalAmount,
                nights,
            });
            if (!result.valid) {
                return reply.code(400).send({ error: result.error });
            }
            return {
                valid: true,
                code: result.code,
                description: result.description,
                discountType: result.discountType,
                discountValue: result.discountValue,
                discountAmount: result.discountAmount,
                finalAmount: result.finalAmount,
            };
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to validate promo code' });
        }
    });
};
exports.publicPromoCodesRoutes = publicPromoCodesRoutes;
//# sourceMappingURL=promocodes.public.routes.js.map