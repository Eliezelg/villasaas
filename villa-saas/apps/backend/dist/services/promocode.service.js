"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePromoCode = validatePromoCode;
exports.applyPromoCode = applyPromoCode;
const database_1 = require("@villa-saas/database");
async function validatePromoCode(params) {
    const { code, tenantId, propertyId, totalAmount, nights, userId } = params;
    const promoCode = await database_1.prisma.promoCode.findFirst({
        where: {
            code: code.toUpperCase(),
            tenantId,
            isActive: true,
        }
    });
    if (!promoCode) {
        return { valid: false, error: 'Code promo invalide' };
    }
    const now = new Date();
    // Vérifier la période de validité
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
        return { valid: false, error: 'Code promo expiré' };
    }
    // Vérifier le montant minimum
    if (promoCode.minAmount && totalAmount < promoCode.minAmount) {
        return {
            valid: false,
            error: `Montant minimum requis: ${promoCode.minAmount}€`
        };
    }
    // Vérifier le nombre minimum de nuits
    if (promoCode.minNights && nights < promoCode.minNights) {
        return {
            valid: false,
            error: `Séjour minimum requis: ${promoCode.minNights} nuits`
        };
    }
    // Vérifier les propriétés éligibles
    if (promoCode.propertyIds.length > 0 && !promoCode.propertyIds.includes(propertyId)) {
        return { valid: false, error: 'Code promo non valide pour cette propriété' };
    }
    // Vérifier la limite d'utilisation globale
    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
        return { valid: false, error: 'Code promo épuisé' };
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
            return {
                valid: false,
                error: `Vous avez déjà utilisé ce code promo ${userUsageCount} fois`
            };
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
}
async function applyPromoCode(promoCodeId) {
    await database_1.prisma.promoCode.update({
        where: { id: promoCodeId },
        data: {
            currentUses: { increment: 1 }
        }
    });
}
//# sourceMappingURL=promocode.service.js.map