"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promocodesRoutes = void 0;
const zod_1 = require("zod");
const database_1 = require("@villa-saas/database");
const utils_1 = require("@villa-saas/utils");
// Schémas de validation
const createPromoCodeSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(20).toUpperCase(),
    description: zod_1.z.string().optional(),
    discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: zod_1.z.number().positive(),
    minAmount: zod_1.z.number().positive().optional(),
    minNights: zod_1.z.number().positive().optional(),
    propertyIds: zod_1.z.array(zod_1.z.string()).optional(),
    validFrom: zod_1.z.string().datetime(),
    validUntil: zod_1.z.string().datetime(),
    maxUses: zod_1.z.number().positive().optional(),
    maxUsesPerUser: zod_1.z.number().positive().optional(),
    isActive: zod_1.z.boolean().default(true),
});
const updatePromoCodeSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    discountValue: zod_1.z.number().positive().optional(),
    minAmount: zod_1.z.number().positive().optional(),
    minNights: zod_1.z.number().positive().optional(),
    propertyIds: zod_1.z.array(zod_1.z.string()).optional(),
    validFrom: zod_1.z.string().datetime().optional(),
    validUntil: zod_1.z.string().datetime().optional(),
    maxUses: zod_1.z.number().positive().optional(),
    maxUsesPerUser: zod_1.z.number().positive().optional(),
    isActive: zod_1.z.boolean().optional(),
});
const validatePromoCodeSchema = zod_1.z.object({
    code: zod_1.z.string().toUpperCase(),
    propertyId: zod_1.z.string(),
    checkIn: zod_1.z.string().datetime(),
    checkOut: zod_1.z.string().datetime(),
    totalAmount: zod_1.z.number().positive(),
    nights: zod_1.z.number().positive(),
    userId: zod_1.z.string().optional(),
});
const promocodesRoutes = async (fastify) => {
    // Lister tous les codes promo
    fastify.get('/promocodes', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const promoCodes = await database_1.prisma.promoCode.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { bookings: true }
                }
            }
        });
        return promoCodes;
    });
    // Obtenir un code promo
    fastify.get('/promocodes/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const promoCode = await database_1.prisma.promoCode.findFirst({
            where: { id, tenantId },
            include: {
                _count: {
                    select: { bookings: true }
                }
            }
        });
        if (!promoCode) {
            return reply.code(404).send({ error: 'Code promo non trouvé' });
        }
        return promoCode;
    });
    // Créer un code promo
    fastify.post('/promocodes', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const validation = createPromoCodeSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.code(400).send({ error: validation.error });
        }
        const data = validation.data;
        // Vérifier si le code existe déjà
        const existing = await database_1.prisma.promoCode.findUnique({
            where: { code: data.code }
        });
        if (existing) {
            return reply.code(400).send({ error: 'Ce code promo existe déjà' });
        }
        // Vérifier les dates
        if (new Date(data.validFrom) >= new Date(data.validUntil)) {
            return reply.code(400).send({ error: 'La date de fin doit être après la date de début' });
        }
        // Vérifier que les propriétés appartiennent bien au tenant
        if (data.propertyIds && data.propertyIds.length > 0) {
            const propertyCount = await database_1.prisma.property.count({
                where: {
                    id: { in: data.propertyIds },
                    tenantId
                }
            });
            if (propertyCount !== data.propertyIds.length) {
                return reply.code(400).send({ error: 'Une ou plusieurs propriétés sont invalides' });
            }
        }
        const promoCode = await database_1.prisma.promoCode.create({
            data: {
                ...data,
                tenantId,
                propertyIds: data.propertyIds || [],
            }
        });
        return reply.code(201).send(promoCode);
    });
    // Mettre à jour un code promo
    fastify.put('/promocodes/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const validation = updatePromoCodeSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.code(400).send({ error: validation.error });
        }
        const data = validation.data;
        // Vérifier que le code promo existe et appartient au tenant
        const existing = await database_1.prisma.promoCode.findFirst({
            where: { id, tenantId }
        });
        if (!existing) {
            return reply.code(404).send({ error: 'Code promo non trouvé' });
        }
        // Vérifier les dates si modifiées
        const validFrom = data.validFrom ? new Date(data.validFrom) : existing.validFrom;
        const validUntil = data.validUntil ? new Date(data.validUntil) : existing.validUntil;
        if (validFrom >= validUntil) {
            return reply.code(400).send({ error: 'La date de fin doit être après la date de début' });
        }
        // Vérifier les propriétés si modifiées
        if (data.propertyIds && data.propertyIds.length > 0) {
            const propertyCount = await database_1.prisma.property.count({
                where: {
                    id: { in: data.propertyIds },
                    tenantId
                }
            });
            if (propertyCount !== data.propertyIds.length) {
                return reply.code(400).send({ error: 'Une ou plusieurs propriétés sont invalides' });
            }
        }
        const promoCode = await database_1.prisma.promoCode.update({
            where: { id },
            data: {
                ...data,
                propertyIds: data.propertyIds !== undefined ? data.propertyIds : existing.propertyIds,
            }
        });
        return promoCode;
    });
    // Supprimer un code promo
    fastify.delete('/promocodes/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        // Vérifier que le code promo existe et appartient au tenant
        const existing = await database_1.prisma.promoCode.findFirst({
            where: { id, tenantId }
        });
        if (!existing) {
            return reply.code(404).send({ error: 'Code promo non trouvé' });
        }
        // Vérifier s'il y a des réservations associées
        const bookingCount = await database_1.prisma.booking.count({
            where: { promoCodeId: id }
        });
        if (bookingCount > 0) {
            return reply.code(400).send({
                error: 'Impossible de supprimer ce code promo car il est utilisé dans des réservations'
            });
        }
        await database_1.prisma.promoCode.delete({
            where: { id }
        });
        return reply.code(204).send();
    });
    // Valider un code promo (pour l'API publique)
    fastify.post('/promocodes/validate', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const validation = validatePromoCodeSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.code(400).send({ error: validation.error });
        }
        const { code, propertyId, checkIn, checkOut, totalAmount, nights, userId } = validation.data;
        const promoCode = await database_1.prisma.promoCode.findFirst({
            where: {
                code,
                tenantId,
                isActive: true,
            }
        });
        if (!promoCode) {
            return reply.code(404).send({ error: 'Code promo invalide' });
        }
        const now = new Date();
        const checkInDate = new Date(checkIn);
        // Vérifier la période de validité
        if (now < promoCode.validFrom || now > promoCode.validUntil) {
            return reply.code(400).send({ error: 'Code promo expiré' });
        }
        // Vérifier le montant minimum
        if (promoCode.minAmount && totalAmount < promoCode.minAmount) {
            return reply.code(400).send({
                error: `Montant minimum requis: ${promoCode.minAmount}€`
            });
        }
        // Vérifier le nombre minimum de nuits
        if (promoCode.minNights && nights < promoCode.minNights) {
            return reply.code(400).send({
                error: `Séjour minimum requis: ${promoCode.minNights} nuits`
            });
        }
        // Vérifier les propriétés éligibles
        if (promoCode.propertyIds.length > 0 && !promoCode.propertyIds.includes(propertyId)) {
            return reply.code(400).send({ error: 'Code promo non valide pour cette propriété' });
        }
        // Vérifier la limite d'utilisation globale
        if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
            return reply.code(400).send({ error: 'Code promo épuisé' });
        }
        // Vérifier la limite d'utilisation par utilisateur
        if (promoCode.maxUsesPerUser && userId) {
            const userUsageCount = await database_1.prisma.booking.count({
                where: {
                    promoCodeId: promoCode.id,
                    userId,
                    status: { not: 'CANCELLED' }
                }
            });
            if (userUsageCount >= promoCode.maxUsesPerUser) {
                return reply.code(400).send({
                    error: `Vous avez déjà utilisé ce code promo ${userUsageCount} fois`
                });
            }
        }
        // Calculer la réduction
        let discountAmount = 0;
        if (promoCode.discountType === 'PERCENTAGE') {
            discountAmount = Math.round(totalAmount * promoCode.discountValue / 100);
        }
        else {
            discountAmount = Math.min(promoCode.discountValue, totalAmount);
        }
        return {
            valid: true,
            promoCodeId: promoCode.id,
            code: promoCode.code,
            description: promoCode.description,
            discountType: promoCode.discountType,
            discountValue: promoCode.discountValue,
            discountAmount,
            finalAmount: totalAmount - discountAmount,
        };
    });
    // Statistiques d'utilisation
    fastify.get('/promocodes/:id/stats', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const promoCode = await database_1.prisma.promoCode.findFirst({
            where: { id, tenantId },
            include: {
                bookings: {
                    select: {
                        id: true,
                        reference: true,
                        total: true,
                        discountAmount: true,
                        createdAt: true,
                        guestEmail: true,
                        status: true,
                    }
                }
            }
        });
        if (!promoCode) {
            return reply.code(404).send({ error: 'Code promo non trouvé' });
        }
        const stats = {
            code: promoCode.code,
            totalUses: promoCode.bookings.length,
            currentUses: promoCode.currentUses,
            totalDiscountGiven: promoCode.bookings.reduce((sum, b) => sum + b.discountAmount, 0),
            bookings: promoCode.bookings,
            conversionRate: promoCode.maxUses
                ? (promoCode.currentUses / promoCode.maxUses) * 100
                : null,
        };
        return stats;
    });
};
exports.promocodesRoutes = promocodesRoutes;
//# sourceMappingURL=promocodes.routes.js.map