import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getTenantId } from '@villa-saas/utils';
import icalRoutes from './ical.routes';

// Schémas de validation Zod pour les validations manuelles
const blockedPeriodSchema = z.object({
  propertyId: z.string().cuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  notes: z.string().optional()
});

const updateBlockedPeriodSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  reason: z.string().optional(),
  notes: z.string().optional()
});

const checkAvailabilitySchema = z.object({
  propertyId: z.string().cuid(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  excludeBookingId: z.string().cuid().optional()
});

export default async function availabilityRoutes(fastify: FastifyInstance) {
  // Enregistrer les routes iCal
  await fastify.register(icalRoutes, { prefix: '/ical' });
  
  // Créer une période bloquée
  fastify.post<{
    Body: {
      propertyId: string;
      startDate: string;
      endDate: string;
      reason?: string;
      notes?: string;
    }
  }>(
    '/blocked-periods',
    { 
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Créer une période bloquée pour une propriété',
        tags: ['availability']
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      
      // Valider manuellement avec Zod
      const validationResult = blockedPeriodSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.code(400).send({ error: validationResult.error.flatten() });
      }
      
      const data = validationResult.data;

      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: data.propertyId,
          tenantId
        }
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      // Vérifier que les dates sont valides
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (startDate >= endDate) {
        return reply.code(400).send({ error: 'End date must be after start date' });
      }

      // Vérifier qu'il n'y a pas de réservations sur cette période
      const existingBookings = await fastify.prisma.booking.findMany({
        where: {
          propertyId: data.propertyId,
          tenantId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          OR: [
            {
              AND: [
                { checkIn: { lte: endDate } },
                { checkOut: { gte: startDate } }
              ]
            }
          ]
        }
      });

      if (existingBookings.length > 0) {
        return reply.code(409).send({ 
          error: 'Cannot block period with existing bookings',
          bookings: existingBookings.map(b => ({
            id: b.id,
            reference: b.reference,
            checkIn: b.checkIn,
            checkOut: b.checkOut
          }))
        });
      }

      // Créer la période bloquée
      const blockedPeriod = await fastify.prisma.blockedPeriod.create({
        data: {
          propertyId: data.propertyId,
          startDate,
          endDate,
          reason: data.reason,
          notes: data.notes
        }
      });

      return reply.code(201).send(blockedPeriod);
    }
  );

  // Lister les périodes bloquées d'une propriété
  fastify.get<{
    Querystring: {
      propertyId: string;
      startDate?: string;
      endDate?: string;
    }
  }>(
    '/blocked-periods',
    { 
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Lister les périodes bloquées',
        tags: ['availability']
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { propertyId, startDate, endDate } = request.query;

      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId
        }
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      const where: any = { propertyId };

      // Filtrer par dates si fournies
      if (startDate && endDate) {
        where.OR = [
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(startDate) } }
            ]
          }
        ];
      }

      const blockedPeriods = await fastify.prisma.blockedPeriod.findMany({
        where,
        orderBy: { startDate: 'asc' }
      });

      return reply.send(blockedPeriods);
    }
  );

  // Modifier une période bloquée
  fastify.patch<{
    Params: { id: string };
    Body: {
      startDate?: string;
      endDate?: string;
      reason?: string;
      notes?: string;
    }
  }>(
    '/blocked-periods/:id',
    { 
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Modifier une période bloquée',
        tags: ['availability']
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { id } = request.params;
      
      // Valider manuellement avec Zod
      const validationResult = updateBlockedPeriodSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.code(400).send({ error: validationResult.error.flatten() });
      }
      
      const updates = validationResult.data;

      // Vérifier que la période bloquée existe et appartient au tenant
      const blockedPeriod = await fastify.prisma.blockedPeriod.findFirst({
        where: { id },
        include: { property: true }
      });

      if (!blockedPeriod || blockedPeriod.property.tenantId !== tenantId) {
        return reply.code(404).send({ error: 'Blocked period not found' });
      }

      // Valider les nouvelles dates si fournies
      const startDate = updates.startDate ? new Date(updates.startDate) : blockedPeriod.startDate;
      const endDate = updates.endDate ? new Date(updates.endDate) : blockedPeriod.endDate;

      if (startDate >= endDate) {
        return reply.code(400).send({ error: 'End date must be after start date' });
      }

      // Mettre à jour
      const updated = await fastify.prisma.blockedPeriod.update({
        where: { id },
        data: {
          startDate,
          endDate,
          reason: updates.reason !== undefined ? updates.reason : blockedPeriod.reason,
          notes: updates.notes !== undefined ? updates.notes : blockedPeriod.notes
        }
      });

      return reply.send(updated);
    }
  );

  // Supprimer une période bloquée
  fastify.delete<{
    Params: { id: string }
  }>(
    '/blocked-periods/:id',
    { 
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Supprimer une période bloquée',
        tags: ['availability']
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { id } = request.params;

      // Vérifier que la période bloquée existe et appartient au tenant
      const blockedPeriod = await fastify.prisma.blockedPeriod.findFirst({
        where: { id },
        include: { property: true }
      });

      if (!blockedPeriod || blockedPeriod.property.tenantId !== tenantId) {
        return reply.code(404).send({ error: 'Blocked period not found' });
      }

      await fastify.prisma.blockedPeriod.delete({
        where: { id }
      });

      return reply.code(204).send();
    }
  );

  // Vérifier la disponibilité
  fastify.post<{
    Body: {
      propertyId: string;
      checkIn: string;
      checkOut: string;
      excludeBookingId?: string;
    }
  }>(
    '/check-availability',
    { 
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Vérifier la disponibilité d\'une propriété',
        tags: ['availability']
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      
      // Valider manuellement avec Zod
      const validationResult = checkAvailabilitySchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.code(400).send({ error: validationResult.error.flatten() });
      }
      
      const { propertyId, checkIn, checkOut, excludeBookingId } = validationResult.data;

      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId
        }
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (checkInDate >= checkOutDate) {
        return reply.code(400).send({ error: 'Check-out must be after check-in' });
      }

      const conflicts = [];

      // Vérifier les réservations existantes
      const bookingWhere: any = {
        propertyId,
        tenantId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gt: checkInDate } }
            ]
          }
        ]
      };

      if (excludeBookingId) {
        bookingWhere.id = { not: excludeBookingId };
      }

      const conflictingBookings = await fastify.prisma.booking.findMany({
        where: bookingWhere,
        select: {
          id: true,
          checkIn: true,
          checkOut: true
        }
      });

      conflicts.push(...conflictingBookings.map(b => ({
        type: 'booking' as const,
        id: b.id,
        startDate: b.checkIn.toISOString(),
        endDate: b.checkOut.toISOString()
      })));

      // Vérifier les périodes bloquées
      const conflictingBlocked = await fastify.prisma.blockedPeriod.findMany({
        where: {
          propertyId,
          OR: [
            {
              AND: [
                { startDate: { lt: checkOutDate } },
                { endDate: { gt: checkInDate } }
              ]
            }
          ]
        },
        select: {
          id: true,
          startDate: true,
          endDate: true
        }
      });

      conflicts.push(...conflictingBlocked.map(b => ({
        type: 'blocked' as const,
        id: b.id,
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString()
      })));

      const available = conflicts.length === 0;

      return reply.send({
        available,
        reason: available ? undefined : 'Dates not available',
        conflicts: available ? undefined : conflicts
      });
    }
  );

  // Obtenir le calendrier de disponibilité
  fastify.get<{
    Querystring: {
      propertyId: string;
      startDate: string;
      endDate: string;
    }
  }>(
    '/availability-calendar',
    { 
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Obtenir le calendrier de disponibilité',
        tags: ['availability']
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { propertyId, startDate, endDate } = request.query;

      // Valider les paramètres de requête
      if (!propertyId || !startDate || !endDate) {
        return reply.code(400).send({ 
          error: 'Missing required parameters: propertyId, startDate, endDate' 
        });
      }

      // Valider le format des dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return reply.code(400).send({ 
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' 
        });
      }

      if (start >= end) {
        return reply.code(400).send({ 
          error: 'End date must be after start date' 
        });
      }

      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId
        }
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      // Limiter à 365 jours maximum
      const maxDays = 365;
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > maxDays) {
        return reply.code(400).send({ error: `Maximum ${maxDays} days allowed` });
      }

      // Récupérer toutes les réservations sur la période
      const bookings = await fastify.prisma.booking.findMany({
        where: {
          propertyId,
          tenantId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          OR: [
            {
              AND: [
                { checkIn: { lte: end } },
                { checkOut: { gte: start } }
              ]
            }
          ]
        },
        select: {
          checkIn: true,
          checkOut: true
        }
      });

      // Récupérer toutes les périodes bloquées
      const blockedPeriods = await fastify.prisma.blockedPeriod.findMany({
        where: {
          propertyId,
          OR: [
            {
              AND: [
                { startDate: { lte: end } },
                { endDate: { gte: start } }
              ]
            }
          ]
        },
        select: {
          startDate: true,
          endDate: true
        }
      });

      // Récupérer les périodes tarifaires
      const periods = await fastify.prisma.period.findMany({
        where: {
          tenantId,
          isActive: true,
          OR: [
            { propertyId },
            { propertyId: null, isGlobal: true }
          ],
          AND: [
            { startDate: { lte: end } },
            { endDate: { gte: start } }
          ]
        },
        orderBy: { priority: 'desc' }
      });

      // Construire le calendrier jour par jour
      const dates = [];
      const current = new Date(start);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        let available = true;
        let reason: 'booked' | 'blocked' | 'past' | undefined;

        // Vérifier si c'est dans le passé
        if (current < today) {
          available = false;
          reason = 'past';
        }

        // Vérifier les réservations
        for (const booking of bookings) {
          if (current >= booking.checkIn && current < booking.checkOut) {
            available = false;
            reason = 'booked';
            break;
          }
        }

        // Vérifier les périodes bloquées
        if (available) {
          for (const blocked of blockedPeriods) {
            if (current >= blocked.startDate && current <= blocked.endDate) {
              available = false;
              reason = 'blocked';
              break;
            }
          }
        }

        // Calculer le prix pour cette date
        let price = property.basePrice;
        let minNights = property.minNights;

        // Appliquer les périodes tarifaires
        for (const period of periods) {
          if (current >= period.startDate && current <= period.endDate) {
            price = period.basePrice;
            if (period.minNights !== null) {
              minNights = period.minNights;
            }
            // Appliquer le supplément weekend
            if ((dayOfWeek === 5 || dayOfWeek === 6) && period.weekendPremium) {
              price += period.weekendPremium;
            }
            break; // Prendre la première période (plus haute priorité)
          }
        }

        // Appliquer le supplément weekend de la propriété si aucune période
        if ((dayOfWeek === 5 || dayOfWeek === 6) && property.weekendPremium) {
          price += property.weekendPremium;
        }

        dates.push({
          date: dateStr,
          available,
          price: available ? price : undefined,
          minNights: available ? minNights : undefined,
          reason
        });

        current.setDate(current.getDate() + 1);
      }

      return reply.send({
        propertyId,
        startDate,
        endDate,
        dates
      });
    }
  );
}