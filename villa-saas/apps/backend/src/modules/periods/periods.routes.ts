import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getTenantId, createTenantFilter, addTenantToData } from '@villa-saas/utils';

const createPeriodSchema = z.object({
  propertyId: z.string().optional(),
  name: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  priority: z.number().int().default(0), // Higher priority periods override lower ones
  basePrice: z.number().positive(),
  weekendPremium: z.number().min(0).default(0),
  minNights: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

const updatePeriodSchema = createPeriodSchema.partial();

export async function periodRoutes(fastify: FastifyInstance): Promise<void> {
  // List periods for a property or all tenant periods
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { propertyId } = request.query as { propertyId?: string };
    
    const where: any = { tenantId };
    if (propertyId) {
      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId,
        },
      });
      
      if (!property) {
        return reply.status(404).send({ error: 'Property not found' });
      }
      
      where.propertyId = propertyId;
    }
    
    const periods = await fastify.prisma.period.findMany({
      where,
      orderBy: [
        { propertyId: 'asc' },
        { priority: 'desc' },
        { startDate: 'asc' },
      ],
    });

    reply.send(periods);
  });

  // Get period by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    
    const period = await fastify.prisma.period.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      return reply.status(404).send({ error: 'Period not found' });
    }

    reply.send(period);
  });

  // Create period
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'startDate', 'endDate', 'basePrice'],
        properties: {
          propertyId: { type: 'string' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          priority: { type: 'integer', minimum: 0 },
          basePrice: { type: 'number', minimum: 0 },
          weekendPremium: { type: 'number', minimum: 0 },
          minNights: { type: 'integer', minimum: 1 },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const data = createPeriodSchema.parse(request.body);

    // Vérifier la propriété si spécifiée
    if (data.propertyId) {
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: data.propertyId,
          tenantId,
        },
      });
      
      if (!property) {
        return reply.status(404).send({ error: 'Property not found' });
      }
    }

    // Note: Les chevauchements sont autorisés car le système utilise les priorités
    // La période avec la priorité la plus élevée sera appliquée

    const period = await fastify.prisma.period.create({
      data: addTenantToData(data, tenantId),
    });

    reply.status(201).send(period);
  });

  // Update period
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    const data = updatePeriodSchema.parse(request.body);

    // Vérifier que la période existe
    const existingPeriod = await fastify.prisma.period.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingPeriod) {
      return reply.status(404).send({ error: 'Period not found' });
    }

    // Note: Les chevauchements sont autorisés car le système utilise les priorités
    // La période avec la priorité la plus élevée sera appliquée

    const period = await fastify.prisma.period.update({
      where: { id },
      data,
    });

    reply.send(period);
  });

  // Delete period
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };

    // Vérifier que la période existe
    const period = await fastify.prisma.period.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      return reply.status(404).send({ error: 'Period not found' });
    }

    // Vérifier s'il y a des réservations sur cette période
    const bookings = await fastify.prisma.booking.count({
      where: {
        propertyId: period.propertyId,
        tenantId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { checkIn: { gte: period.startDate } },
              { checkIn: { lte: period.endDate } },
            ],
          },
          {
            AND: [
              { checkOut: { gte: period.startDate } },
              { checkOut: { lte: period.endDate } },
            ],
          },
        ],
      },
    });

    if (bookings > 0) {
      return reply.status(400).send({ 
        error: 'Impossible de supprimer cette période car elle contient des réservations actives',
      });
    }

    await fastify.prisma.period.delete({
      where: { id },
    });

    reply.status(204).send();
  });
}