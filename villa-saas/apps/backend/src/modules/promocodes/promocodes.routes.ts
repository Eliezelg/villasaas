import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@villa-saas/database'
import { getTenantId } from '@villa-saas/utils'

// Schémas de validation
const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive(),
  minAmount: z.number().positive().optional(),
  minNights: z.number().positive().optional(),
  propertyIds: z.array(z.string()).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  maxUses: z.number().positive().optional(),
  maxUsesPerUser: z.number().positive().optional(),
  isActive: z.boolean().default(true),
})

const updatePromoCodeSchema = z.object({
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.number().positive().optional(),
  minAmount: z.number().positive().optional(),
  minNights: z.number().positive().optional(),
  propertyIds: z.array(z.string()).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  maxUses: z.number().positive().optional(),
  maxUsesPerUser: z.number().positive().optional(),
  isActive: z.boolean().optional(),
})

const validatePromoCodeSchema = z.object({
  code: z.string().toUpperCase(),
  propertyId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  totalAmount: z.number().positive(),
  nights: z.number().positive(),
  userId: z.string().optional(),
})

export const promocodesRoutes: FastifyPluginAsync = async (fastify) => {
  // Lister tous les codes promo
  fastify.get('/promocodes', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request)

    const promoCodes = await prisma.promoCode.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })

    return promoCodes
  })

  // Obtenir un code promo
  fastify.get('/promocodes/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request)
    const { id } = request.params as { id: string }

    const promoCode = await prisma.promoCode.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })

    if (!promoCode) {
      return reply.code(404).send({ error: 'Code promo non trouvé' })
    }

    return promoCode
  })

  // Créer un code promo
  fastify.post('/promocodes', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request)
    const validation = createPromoCodeSchema.safeParse(request.body)

    if (!validation.success) {
      return reply.code(400).send({ error: validation.error })
    }

    const data = validation.data

    // Vérifier si le code existe déjà
    const existing = await prisma.promoCode.findUnique({
      where: { code: data.code }
    })

    if (existing) {
      return reply.code(400).send({ error: 'Ce code promo existe déjà' })
    }

    // Vérifier les dates
    if (new Date(data.validFrom) >= new Date(data.validUntil)) {
      return reply.code(400).send({ error: 'La date de fin doit être après la date de début' })
    }

    // Vérifier que les propriétés appartiennent bien au tenant
    if (data.propertyIds && data.propertyIds.length > 0) {
      const propertyCount = await prisma.property.count({
        where: {
          id: { in: data.propertyIds },
          tenantId
        }
      })

      if (propertyCount !== data.propertyIds.length) {
        return reply.code(400).send({ error: 'Une ou plusieurs propriétés sont invalides' })
      }
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        ...data,
        tenantId,
        propertyIds: data.propertyIds || [],
      }
    })

    return reply.code(201).send(promoCode)
  })

  // Mettre à jour un code promo
  fastify.put('/promocodes/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request)
    const { id } = request.params as { id: string }
    const validation = updatePromoCodeSchema.safeParse(request.body)

    if (!validation.success) {
      return reply.code(400).send({ error: validation.error })
    }

    const data = validation.data

    // Vérifier que le code promo existe et appartient au tenant
    const existing = await prisma.promoCode.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return reply.code(404).send({ error: 'Code promo non trouvé' })
    }

    // Vérifier les dates si modifiées
    const validFrom = data.validFrom ? new Date(data.validFrom) : existing.validFrom
    const validUntil = data.validUntil ? new Date(data.validUntil) : existing.validUntil
    
    if (validFrom >= validUntil) {
      return reply.code(400).send({ error: 'La date de fin doit être après la date de début' })
    }

    // Vérifier les propriétés si modifiées
    if (data.propertyIds && data.propertyIds.length > 0) {
      const propertyCount = await prisma.property.count({
        where: {
          id: { in: data.propertyIds },
          tenantId
        }
      })

      if (propertyCount !== data.propertyIds.length) {
        return reply.code(400).send({ error: 'Une ou plusieurs propriétés sont invalides' })
      }
    }

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: {
        ...data,
        propertyIds: data.propertyIds !== undefined ? data.propertyIds : existing.propertyIds,
      }
    })

    return promoCode
  })

  // Supprimer un code promo
  fastify.delete('/promocodes/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request)
    const { id } = request.params as { id: string }

    // Vérifier que le code promo existe et appartient au tenant
    const existing = await prisma.promoCode.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return reply.code(404).send({ error: 'Code promo non trouvé' })
    }

    // Vérifier s'il y a des réservations associées
    const bookingCount = await prisma.booking.count({
      where: { promoCodeId: id }
    })

    if (bookingCount > 0) {
      return reply.code(400).send({ 
        error: 'Impossible de supprimer ce code promo car il est utilisé dans des réservations' 
      })
    }

    await prisma.promoCode.delete({
      where: { id }
    })

    return reply.code(204).send()
  })

  // Valider un code promo (pour l'API publique)
  fastify.post('/promocodes/validate', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request)
    const validation = validatePromoCodeSchema.safeParse(request.body)

    if (!validation.success) {
      return reply.code(400).send({ error: validation.error })
    }

    const { code, propertyId, checkIn, checkOut, totalAmount, nights, userId } = validation.data

    const promoCode = await prisma.promoCode.findFirst({
      where: {
        code,
        tenantId,
        isActive: true,
      }
    })

    if (!promoCode) {
      return reply.code(404).send({ error: 'Code promo invalide' })
    }

    const now = new Date()
    const checkInDate = new Date(checkIn)

    // Vérifier la période de validité
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return reply.code(400).send({ error: 'Code promo expiré' })
    }

    // Vérifier le montant minimum
    if (promoCode.minAmount && totalAmount < promoCode.minAmount) {
      return reply.code(400).send({ 
        error: `Montant minimum requis: ${promoCode.minAmount}€` 
      })
    }

    // Vérifier le nombre minimum de nuits
    if (promoCode.minNights && nights < promoCode.minNights) {
      return reply.code(400).send({ 
        error: `Séjour minimum requis: ${promoCode.minNights} nuits` 
      })
    }

    // Vérifier les propriétés éligibles
    if (promoCode.propertyIds.length > 0 && !promoCode.propertyIds.includes(propertyId)) {
      return reply.code(400).send({ error: 'Code promo non valide pour cette propriété' })
    }

    // Vérifier la limite d'utilisation globale
    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return reply.code(400).send({ error: 'Code promo épuisé' })
    }

    // Vérifier la limite d'utilisation par utilisateur
    if (promoCode.maxUsesPerUser && userId) {
      const userUsageCount = await prisma.booking.count({
        where: {
          promoCodeId: promoCode.id,
          userId,
          status: { not: 'CANCELLED' }
        }
      })

      if (userUsageCount >= promoCode.maxUsesPerUser) {
        return reply.code(400).send({ 
          error: `Vous avez déjà utilisé ce code promo ${userUsageCount} fois` 
        })
      }
    }

    // Calculer la réduction
    let discountAmount = 0
    if (promoCode.discountType === 'PERCENTAGE') {
      discountAmount = Math.round(totalAmount * promoCode.discountValue / 100)
    } else {
      discountAmount = Math.min(promoCode.discountValue, totalAmount)
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
    }
  })

  // Statistiques d'utilisation
  fastify.get('/promocodes/:id/stats', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request)
    const { id } = request.params as { id: string }

    const promoCode = await prisma.promoCode.findFirst({
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
    })

    if (!promoCode) {
      return reply.code(404).send({ error: 'Code promo non trouvé' })
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
    }

    return stats
  })
}