import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getTenantId } from '@villa-saas/utils';
import { BookingService } from './booking.service';

// Schémas de validation
const createBookingSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  adults: z.number().int().positive(),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).default(0),
  pets: z.number().int().min(0).default(0),
  guestFirstName: z.string().min(1),
  guestLastName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(1),
  guestCountry: z.string().optional(),
  guestAddress: z.string().optional(),
  guestNotes: z.string().optional(),
  specialRequests: z.string().optional(),
  source: z.string().optional(),
  externalId: z.string().optional(),
});

const updateBookingSchema = z.object({
  guestFirstName: z.string().min(1).optional(),
  guestLastName: z.string().min(1).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().min(1).optional(),
  guestCountry: z.string().optional(),
  guestAddress: z.string().optional(),
  guestNotes: z.string().optional(),
  specialRequests: z.string().optional(),
  internalNotes: z.string().optional(),
});

const bookingFiltersSchema = z.object({
  propertyId: z.string().min(1).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'checkIn', 'checkOut', 'total']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function bookingRoutes(fastify: FastifyInstance) {
  const bookingService = new BookingService(fastify.prisma);

  // Calculer le prix d'une réservation
  fastify.post(
    '/bookings/calculate-price',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Calculer le prix d\'une réservation',
        tags: ['bookings'],
      }
    },
    async (request, reply) => {
      const validation = z.object({
        propertyId: z.string().min(1),
        checkIn: z.string().datetime(),
        checkOut: z.string().datetime(),
        adults: z.number().int().positive(),
        children: z.number().int().min(0).default(0),
        infants: z.number().int().min(0).default(0),
        pets: z.number().int().min(0).default(0),
      }).safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({ error: validation.error });
      }

      const data = validation.data;
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);

      try {
        // Vérifier la disponibilité
        const availability = await bookingService.checkAvailability(
          data.propertyId,
          checkIn,
          checkOut
        );

        if (!availability.available) {
          return reply.code(409).send({ 
            error: availability.reason,
            available: false 
          });
        }

        // Calculer le prix
        const priceCalculation = await bookingService.calculateBookingPrice(
          data.propertyId,
          checkIn,
          checkOut,
          {
            adults: data.adults,
            children: data.children,
            infants: data.infants,
            pets: data.pets
          }
        );

        return reply.send({
          available: true,
          ...priceCalculation,
          commission: {
            rate: 0.15,
            amount: priceCalculation.total * 0.15
          }
        });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Créer une réservation
  fastify.post(
    '/bookings',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Créer une nouvelle réservation',
        tags: ['bookings'],
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      
      // Valider les données
      const validation = createBookingSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({ error: validation.error });
      }

      const data = validation.data;

      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: data.propertyId,
          tenantId,
          status: 'PUBLISHED'
        },
        include: {
          periods: {
            where: { isActive: true }
          }
        }
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      // Calculer les dates et le nombre de nuits
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      if (nights <= 0) {
        return reply.code(400).send({ error: 'Invalid dates' });
      }

      // Vérifier la disponibilité
      const availability = await bookingService.checkAvailability(
        data.propertyId,
        checkIn,
        checkOut
      );

      if (!availability.available) {
        return reply.code(409).send({ error: availability.reason });
      }

      // Calculer le prix total
      const priceCalculation = await bookingService.calculateBookingPrice(
        data.propertyId,
        checkIn,
        checkOut,
        {
          adults: data.adults,
          children: data.children,
          infants: data.infants,
          pets: data.pets
        }
      );

      // Générer une référence unique
      const reference = await bookingService.generateReference();

      // Calculer les montants de commission
      const commissionAmount = priceCalculation.total * 0.15; // 15% de commission
      const payoutAmount = priceCalculation.total - commissionAmount;

      // Créer la réservation
      const booking = await fastify.prisma.booking.create({
        data: {
          tenantId,
          propertyId: data.propertyId,
          reference,
          checkIn,
          checkOut,
          nights: priceCalculation.nights,
          adults: data.adults,
          children: data.children,
          infants: data.infants,
          pets: data.pets,
          guestFirstName: data.guestFirstName,
          guestLastName: data.guestLastName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          guestCountry: data.guestCountry,
          guestAddress: data.guestAddress,
          guestNotes: data.guestNotes,
          specialRequests: data.specialRequests,
          source: data.source,
          externalId: data.externalId,
          status: 'PENDING',
          accommodationTotal: priceCalculation.accommodationTotal,
          cleaningFee: priceCalculation.cleaningFee,
          touristTax: priceCalculation.touristTax,
          extraFees: priceCalculation.extraFees,
          discountAmount: priceCalculation.discountAmount,
          subtotal: priceCalculation.subtotal,
          total: priceCalculation.total,
          commissionAmount,
          payoutAmount,
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              images: { select: { id: true, url: true, order: true } }
            }
          }
        }
      });

      return reply.code(201).send(booking);
    }
  );

  // Lister les réservations
  fastify.get(
    '/bookings',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Lister les réservations',
        tags: ['bookings'],
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      
      // Valider les filtres
      const validation = bookingFiltersSchema.safeParse(request.query);
      if (!validation.success) {
        return reply.code(400).send({ error: validation.error });
      }

      const filters = validation.data;
      const skip = (filters.page - 1) * filters.limit;

      // Construire la requête
      const where: any = { tenantId };

      if (filters.propertyId) {
        where.propertyId = filters.propertyId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        where.checkIn = {};
        if (filters.startDate) {
          where.checkIn.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.checkIn.lte = new Date(filters.endDate);
        }
      }

      if (filters.search) {
        where.OR = [
          { reference: { contains: filters.search, mode: 'insensitive' } },
          { guestFirstName: { contains: filters.search, mode: 'insensitive' } },
          { guestLastName: { contains: filters.search, mode: 'insensitive' } },
          { guestEmail: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Exécuter les requêtes
      const [bookings, total] = await Promise.all([
        fastify.prisma.booking.findMany({
          where,
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                images: { select: { id: true, url: true, order: true } }
              }
            }
          },
          orderBy: {
            [filters.sortBy]: filters.sortOrder
          },
          skip,
          take: filters.limit
        }),
        fastify.prisma.booking.count({ where })
      ]);

      return reply.send({
        bookings,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          pages: Math.ceil(total / filters.limit)
        }
      });
    }
  );

  // Obtenir une réservation
  fastify.get<{
    Params: { id: string }
  }>(
    '/bookings/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Obtenir une réservation',
        tags: ['bookings'],
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { id } = request.params;

      const booking = await fastify.prisma.booking.findFirst({
        where: { id, tenantId },
        include: {
          property: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!booking) {
        return reply.code(404).send({ error: 'Booking not found' });
      }

      return reply.send(booking);
    }
  );

  // Mettre à jour une réservation
  fastify.patch<{
    Params: { id: string }
  }>(
    '/bookings/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Mettre à jour une réservation',
        tags: ['bookings'],
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { id } = request.params;

      // Valider les données
      const validation = updateBookingSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({ error: validation.error });
      }

      const data = validation.data;

      // Vérifier que la réservation existe
      const booking = await fastify.prisma.booking.findFirst({
        where: { id, tenantId }
      });

      if (!booking) {
        return reply.code(404).send({ error: 'Booking not found' });
      }

      // Empêcher la modification des réservations annulées ou terminées
      if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
        return reply.code(400).send({ error: 'Cannot modify this booking' });
      }

      // Mettre à jour
      const updated = await fastify.prisma.booking.update({
        where: { id },
        data,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              images: { select: { id: true, url: true, order: true } }
            }
          }
        }
      });

      return reply.send(updated);
    }
  );

  // Confirmer une réservation
  fastify.post<{
    Params: { id: string }
  }>(
    '/bookings/:id/confirm',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Confirmer une réservation',
        tags: ['bookings'],
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { id } = request.params;

      const booking = await fastify.prisma.booking.findFirst({
        where: { id, tenantId }
      });

      if (!booking) {
        return reply.code(404).send({ error: 'Booking not found' });
      }

      if (booking.status !== 'PENDING') {
        return reply.code(400).send({ error: 'Booking cannot be confirmed' });
      }

      const updated = await fastify.prisma.booking.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              images: { select: { id: true, url: true, order: true } }
            }
          }
        }
      });

      // TODO: Envoyer email de confirmation

      return reply.send(updated);
    }
  );

  // Annuler une réservation
  fastify.post<{
    Params: { id: string },
    Body: { reason?: string }
  }>(
    '/bookings/:id/cancel',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Annuler une réservation',
        tags: ['bookings'],
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { id } = request.params;
      const { reason } = request.body;

      const booking = await fastify.prisma.booking.findFirst({
        where: { id, tenantId }
      });

      if (!booking) {
        return reply.code(404).send({ error: 'Booking not found' });
      }

      if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
        return reply.code(400).send({ error: 'Booking cannot be cancelled' });
      }

      const updated = await fastify.prisma.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationDate: new Date(),
          cancellationReason: reason
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              images: { select: { id: true, url: true, order: true } }
            }
          }
        }
      });

      // TODO: Gérer le remboursement si nécessaire

      return reply.send(updated);
    }
  );

  // Statistiques des réservations
  fastify.get<{
    Querystring: {
      propertyId?: string;
      startDate?: string;
      endDate?: string;
    }
  }>(
    '/bookings/stats',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Obtenir les statistiques des réservations',
        tags: ['bookings'],
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { propertyId, startDate, endDate } = request.query;

      const where: any = { tenantId };

      if (propertyId) {
        where.propertyId = propertyId;
      }

      if (startDate || endDate) {
        where.checkIn = {};
        if (startDate) {
          where.checkIn.gte = new Date(startDate);
        }
        if (endDate) {
          where.checkIn.lte = new Date(endDate);
        }
      }

      const [
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        averageStay
      ] = await Promise.all([
        // Total des réservations
        fastify.prisma.booking.count({ where }),
        
        // Réservations confirmées
        fastify.prisma.booking.count({
          where: { ...where, status: 'CONFIRMED' }
        }),
        
        // Réservations annulées
        fastify.prisma.booking.count({
          where: { ...where, status: 'CANCELLED' }
        }),
        
        // Revenu total
        fastify.prisma.booking.aggregate({
          where: { ...where, status: { in: ['CONFIRMED', 'COMPLETED'] } },
          _sum: { total: true }
        }),
        
        // Durée moyenne de séjour
        fastify.prisma.booking.aggregate({
          where: { ...where, status: { in: ['CONFIRMED', 'COMPLETED'] } },
          _avg: { nights: true }
        })
      ]);

      return reply.send({
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        cancellationRate: totalBookings > 0 
          ? (cancelledBookings / totalBookings * 100).toFixed(1) 
          : 0,
        totalRevenue: totalRevenue._sum.total || 0,
        averageStay: averageStay._avg.nights || 0,
        occupancyRate: 0 // TODO: Calculer le taux d'occupation réel
      });
    }
  );
}