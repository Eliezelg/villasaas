import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getTenantId } from '@villa-saas/utils';
import { PricingService } from '../../services/pricing.service';

const calculatePriceSchema = z.object({
  propertyId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().positive(),
  adults: z.number().int().positive().optional(),
  children: z.number().int().min(0).optional(),
  selectedOptions: z.array(z.object({
    optionId: z.string(),
    quantity: z.number().int().positive()
  })).optional()
});

export async function pricingRoutes(fastify: FastifyInstance): Promise<void> {
  const pricingService = new PricingService(fastify.prisma);

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
          adults: { type: 'integer', minimum: 1 },
          children: { type: 'integer', minimum: 0 },
          selectedOptions: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                optionId: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 }
              }
            }
          }
        },
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const data = calculatePriceSchema.parse(request.body);

    try {
      const pricing = await pricingService.calculatePrice({
        ...data,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        tenantId,
      });

      reply.send(pricing);
    } catch (error) {
      if (error instanceof Error) {
        reply.status(400).send({ error: error.message });
      } else {
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
    const tenantId = getTenantId(request);
    const { propertyId, checkIn, checkOut, excludeBookingId } = request.query as any;

    try {
      const available = await pricingService.checkAvailability(
        propertyId,
        new Date(checkIn),
        new Date(checkOut),
        tenantId,
        excludeBookingId
      );

      reply.send({ available });
    } catch (error) {
      reply.status(500).send({ error: 'Failed to check availability' });
    }
  });
}