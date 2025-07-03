import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { differenceInDays } from 'date-fns';
import { PricingService } from '../../services/pricing.service';

// Schémas de validation
const publicPropertyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  search: z.string().optional(),
  city: z.string().optional(),
  guests: z.coerce.number().int().positive().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  // Filters
  propertyType: z.array(z.string()).or(z.string()).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') return val.split(',');
    return val;
  }),
  // Handle both object and query string format for priceRange
  'priceRange[min]': z.coerce.number().optional(),
  'priceRange[max]': z.coerce.number().optional(),
  bedrooms: z.array(z.coerce.number()).or(z.string()).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') return val.split(',').map(Number);
    return val;
  }),
  amenities: z.array(z.string()).or(z.string()).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') return val.split(',');
    return val;
  }),
  atmosphere: z.array(z.string()).or(z.string()).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') return val.split(',');
    return val;
  }),
  sortBy: z.enum(['basePrice', 'createdAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const calculatePriceSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().positive(),
});

const publicBookingSchema = z.object({
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
  guestCountry: z.string().length(2),
  guestAddress: z.string().optional(),
  specialRequests: z.string().optional(),
  paymentIntentId: z.string().optional(),
});

export async function publicRoutes(fastify: FastifyInstance) {
  const pricingService = new PricingService(fastify.prisma);

  // Obtenir les infos d'un tenant par domaine
  fastify.get('/public/tenant-by-domain/:domain', async (request, reply) => {
    const { domain } = request.params as { domain: string };
    
    try {
      // Chercher d'abord par domaine personnalisé
      let tenant = await fastify.prisma.tenant.findFirst({
        where: {
          publicSite: {
            domain,
            isActive: true,
          }
        },
        include: {
          publicSite: {
            select: {
              domain: true,
              subdomain: true,
              theme: true,
              logo: true,
              favicon: true,
              metadata: true,
              defaultLocale: true,
              locales: true,
            }
          }
        }
      });

      // Si pas trouvé, chercher par sous-domaine
      if (!tenant) {
        const subdomain = domain.split('.')[0];
        tenant = await fastify.prisma.tenant.findFirst({
          where: {
            OR: [
              { subdomain },
              {
                publicSite: {
                  subdomain,
                  isActive: true,
                }
              }
            ]
          },
          include: {
            publicSite: {
              select: {
                domain: true,
                subdomain: true,
                theme: true,
                logo: true,
                favicon: true,
                metadata: true,
                defaultLocale: true,
                locales: true,
              }
            }
          }
        });
      }

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          ...tenant.publicSite,
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch tenant' });
    }
  });

  // Obtenir les infos d'un tenant par subdomain (pour l'API route Next.js)
  fastify.get('/public/tenant/:subdomain', async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };
    
    try {
      const tenant = await fastify.prisma.tenant.findFirst({
        where: {
          OR: [
            { subdomain },
            {
              publicSite: {
                subdomain,
                isActive: true,
              }
            }
          ]
        },
        include: {
          publicSite: {
            select: {
              domain: true,
              subdomain: true,
              theme: true,
              logo: true,
              favicon: true,
              metadata: true,
              defaultLocale: true,
              locales: true,
            }
          }
        }
      });

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        ...tenant.publicSite,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch tenant' });
    }
  });

  // Lister les propriétés publiques
  fastify.get('/public/properties', {
    schema: {
      description: 'Liste des propriétés publiques',
      tags: ['public'],
    }
  }, async (request, reply) => {
    const validation = publicPropertyQuerySchema.safeParse(request.query);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { page, limit, search, city, guests, checkIn, checkOut, propertyType, bedrooms, amenities, atmosphere, sortBy, sortOrder } = validation.data;
    // Extract price range from the special keys
    const priceRange = {
      min: validation.data['priceRange[min]'],
      max: validation.data['priceRange[max]'],
    };
    const tenantSubdomain = request.headers['x-tenant'] as string;
    
    if (!tenantSubdomain) {
      return reply.code(400).send({ error: 'Tenant not specified' });
    }

    try {
      // Récupérer le tenant
      const tenant = await fastify.prisma.tenant.findFirst({
        where: { subdomain: tenantSubdomain }
      });

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      // Construire la requête
      const where: any = {
        tenantId: tenant.id,
        status: 'PUBLISHED',
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }

      // Property type filter
      if (propertyType && propertyType.length > 0) {
        where.type = { in: propertyType };
      }

      // Price range filter
      if (priceRange) {
        if (priceRange.min !== undefined) {
          where.basePrice = { ...where.basePrice, gte: priceRange.min };
        }
        if (priceRange.max !== undefined) {
          where.basePrice = { ...where.basePrice, lte: priceRange.max };
        }
      }

      if (guests !== undefined) {
        where.maxGuests = { gte: guests };
      }

      // Bedrooms filter (any of the selected values)
      if (bedrooms && bedrooms.length > 0) {
        where.bedrooms = { gte: Math.min(...bedrooms) };
      }

      // Amenities filter (must have all selected amenities)
      if (amenities && amenities.length > 0) {
        where.amenities = { hasEvery: amenities };
      }

      // Atmosphere filter (must have all selected atmospheres)
      if (atmosphere && atmosphere.length > 0) {
        where.atmosphere = { hasEvery: atmosphere };
      }

      // Si des dates sont spécifiées, vérifier la disponibilité
      let availablePropertyIds: string[] | undefined;
      if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        // Récupérer toutes les propriétés du tenant
        const allProperties = await fastify.prisma.property.findMany({
          where: { tenantId: tenant.id, status: 'PUBLISHED' },
          select: { id: true },
        });

        // Vérifier les réservations existantes
        const bookedProperties = await fastify.prisma.booking.findMany({
          where: {
            tenantId: tenant.id,
            status: { in: ['CONFIRMED', 'PENDING'] },
            OR: [
              {
                AND: [
                  { checkIn: { lte: checkOutDate } },
                  { checkOut: { gte: checkInDate } }
                ]
              }
            ]
          },
          select: { propertyId: true },
          distinct: ['propertyId'],
        });

        const bookedPropertyIds = bookedProperties.map(b => b.propertyId);
        availablePropertyIds = allProperties
          .map(p => p.id)
          .filter(id => !bookedPropertyIds.includes(id));

        where.id = { in: availablePropertyIds };
      }

      // Compter le total
      const total = await fastify.prisma.property.count({ where });

      // Récupérer les propriétés
      const properties = await fastify.prisma.property.findMany({
        where,
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 5,
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        properties,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch properties' });
    }
  });

  // Obtenir les détails d'une propriété
  fastify.get('/public/properties/:id', {
    schema: {
      description: 'Détails d\'une propriété publique',
      tags: ['public'],
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantSubdomain = request.headers['x-tenant'] as string;
    
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

      const property = await fastify.prisma.property.findFirst({
        where: {
          id,
          tenantId: tenant.id,
          status: 'PUBLISHED',
        },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          periods: {
            where: {
              isActive: true,
              endDate: { gte: new Date() },
            },
            orderBy: { startDate: 'asc' },
          },
        },
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      return property;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch property' });
    }
  });

  // Calculer le prix d'un séjour
  fastify.post('/public/pricing/calculate', {
    schema: {
      description: 'Calculer le prix d\'un séjour',
      tags: ['public'],
    }
  }, async (request, reply) => {
    const validation = calculatePriceSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { propertyId, checkIn, checkOut, guests } = validation.data;
    const tenantSubdomain = request.headers['x-tenant'] as string;
    
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

      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId: tenant.id,
          status: 'PUBLISHED',
        },
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      // Calculer le prix
      const pricing = await pricingService.calculatePrice({
        propertyId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests,
        tenantId: tenant.id,
      });

      return pricing;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error instanceof Error ? error.message : 'Failed to calculate price' });
    }
  });

  // Vérifier la disponibilité
  fastify.get('/public/availability', {
    schema: {
      description: 'Vérifier la disponibilité d\'une propriété',
      tags: ['public'],
    }
  }, async (request, reply) => {
    const { propertyId, startDate, endDate } = request.query as {
      propertyId: string;
      startDate: string;
      endDate: string;
    };

    const tenantSubdomain = request.headers['x-tenant'] as string;
    
    if (!tenantSubdomain) {
      return reply.code(400).send({ error: 'Tenant not specified' });
    }

    if (!propertyId || !startDate || !endDate) {
      return reply.code(400).send({ error: 'Missing required parameters' });
    }

    try {
      const tenant = await fastify.prisma.tenant.findFirst({
        where: { subdomain: tenantSubdomain }
      });

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      const property = await fastify.prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId: tenant.id,
          status: 'PUBLISHED',
        },
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Vérifier les réservations
      const conflictingBooking = await fastify.prisma.booking.findFirst({
        where: {
          propertyId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          OR: [
            {
              AND: [
                { checkIn: { lte: end } },
                { checkOut: { gte: start } }
              ]
            }
          ]
        }
      });

      if (conflictingBooking) {
        return { available: false, reason: 'Dates already booked' };
      }

      // Vérifier les périodes bloquées
      const blockedPeriod = await fastify.prisma.blockedPeriod.findFirst({
        where: {
          propertyId,
          startDate: { lte: end },
          endDate: { gte: start }
        }
      });

      if (blockedPeriod) {
        return { available: false, reason: blockedPeriod.reason || 'Dates blocked' };
      }

      // Vérifier la durée minimum
      const nights = differenceInDays(end, start);
      const applicablePeriod = await fastify.prisma.period.findFirst({
        where: {
          propertyId,
          isActive: true,
          startDate: { lte: start },
          endDate: { gte: start }
        },
        orderBy: { priority: 'desc' }
      });

      const minNights = applicablePeriod?.minNights || property.minNights;
      if (minNights && nights < minNights) {
        return { 
          available: false, 
          reason: `Minimum stay of ${minNights} nights required` 
        };
      }

      return { available: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to check availability' });
    }
  });
}