import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { validatePromoCode } from '../../services/promocode.service'

const validatePromoCodeSchema = z.object({
  code: z.string().toUpperCase(),
  propertyId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  totalAmount: z.number().positive(),
  nights: z.number().positive(),
})

export const publicPromoCodesRoutes: FastifyPluginAsync = async (fastify) => {
  // Valider un code promo publiquement
  fastify.post('/public/promocodes/validate', {
    schema: {
      description: 'Valider un code promo',
      tags: ['public'],
    }
  }, async (request, reply) => {
    const validation = validatePromoCodeSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error })
    }

    // Check for tenant in header or query params
    const tenantSubdomain = (request.headers['x-tenant'] as string) || (request.query as any).tenantId
    
    if (!tenantSubdomain) {
      return reply.code(400).send({ error: 'Tenant not specified' })
    }

    try {
      const tenant = await fastify.prisma.tenant.findFirst({
        where: { subdomain: tenantSubdomain }
      })

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' })
      }

      const { code, propertyId, checkIn, checkOut, totalAmount, nights } = validation.data

      const result = await validatePromoCode({
        code,
        tenantId: tenant.id,
        propertyId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        totalAmount,
        nights,
      })

      if (!result.valid) {
        return reply.code(400).send({ error: result.error })
      }

      return {
        valid: true,
        code: result.code,
        description: result.description,
        discountType: result.discountType,
        discountValue: result.discountValue,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: 'Failed to validate promo code' })
    }
  })
}