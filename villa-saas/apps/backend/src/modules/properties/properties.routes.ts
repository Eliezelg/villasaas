import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getTenantId, createTenantFilter, addTenantToData } from '@villa-saas/utils';
import { PropertyAIService } from '../../services/property-ai.service';

const createPropertySchema = z.object({
  name: z.string().min(1).max(100),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LOFT', 'CHALET', 'BUNGALOW', 'MOBILE_HOME', 'BOAT', 'OTHER']),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().default('FR'),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  maxGuests: z.number().int().min(1),
  surfaceArea: z.number().optional(),
  description: z.record(z.string()),
  basePrice: z.number().positive(),
  weekendPremium: z.number().optional(),
  cleaningFee: z.number().optional(),
  securityDeposit: z.number().optional(),
  minNights: z.number().int().min(1).default(1),
  checkInTime: z.string().default('16:00'),
  checkOutTime: z.string().default('11:00'),
  instantBooking: z.boolean().default(false),
});

export async function propertyRoutes(fastify: FastifyInstance): Promise<void> {
  // List properties
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    
    const properties = await fastify.prisma.property.findMany({
      where: createTenantFilter(tenantId),
      include: {
        _count: {
          select: {
            bookings: true,
            images: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Si aucune image primaire, prendre la première image
    const propertiesWithImages = await Promise.all(
      properties.map(async (property) => {
        if (property.images.length === 0 && property._count.images > 0) {
          const firstImage = await fastify.prisma.propertyImage.findFirst({
            where: { propertyId: property.id },
            orderBy: { order: 'asc' },
          });
          return {
            ...property,
            images: firstImage ? [firstImage] : [],
          };
        }
        return property;
      })
    );

    reply.send(propertiesWithImages);
  });

  // Get property by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    
    const property = await fastify.prisma.property.findFirst({
      where: {
        id,
        ...createTenantFilter(tenantId),
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        periods: {
          where: {
            endDate: { gte: new Date() },
            isActive: true,
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!property) {
      reply.status(404).send({ error: 'Property not found' });
      return;
    }

    reply.send(property);
  });

  // Create property
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'propertyType', 'address', 'city', 'postalCode', 'bedrooms', 'bathrooms', 'maxGuests', 'description', 'basePrice'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          propertyType: { type: 'string', enum: ['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LOFT', 'CHALET', 'BUNGALOW', 'MOBILE_HOME', 'BOAT', 'OTHER'] },
          address: { type: 'string', minLength: 1 },
          city: { type: 'string', minLength: 1 },
          postalCode: { type: 'string', minLength: 1 },
          country: { type: 'string' },
          bedrooms: { type: 'integer', minimum: 0 },
          bathrooms: { type: 'integer', minimum: 0 },
          maxGuests: { type: 'integer', minimum: 1 },
          surfaceArea: { type: 'number' },
          description: { type: 'object' },
          basePrice: { type: 'number', minimum: 0 },
          weekendPremium: { type: 'number' },
          cleaningFee: { type: 'number' },
          securityDeposit: { type: 'number' },
          minNights: { type: 'integer', minimum: 1 },
          checkInTime: { type: 'string' },
          checkOutTime: { type: 'string' },
          instantBooking: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const data = request.body as any;

    // Générer un slug unique
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await fastify.prisma.property.findFirst({
        where: {
          slug,
          tenantId,
        },
      });
      
      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Préparer les données avec le contenu searchable
    const propertyData = {
      ...data,
      slug,
      amenities: data.amenities || {},
      atmosphere: data.atmosphere || {},
      proximity: data.proximity || {},
    };

    // Générer le contenu searchable
    const searchableContent = PropertyAIService.generateSearchableContent(propertyData);
    
    // Générer l'embedding (async mais on ne bloque pas)
    const embeddingContent = PropertyAIService.prepareEmbeddingContent(propertyData);
    PropertyAIService.generateEmbedding(embeddingContent).then(embedding => {
      // Mettre à jour l'embedding en arrière-plan
      if (embedding.length > 0) {
        fastify.prisma.property.update({
          where: { id: property.id },
          data: { embedding }
        }).catch(err => {
          fastify.log.error('Failed to update embedding:', err);
        });
      }
    });

    const property = await fastify.prisma.property.create({
      data: addTenantToData({
        ...propertyData,
        searchableContent,
      }, tenantId),
    });

    reply.status(201).send(property);
  });

  // Update property
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    const data = request.body as any;

    const property = await fastify.prisma.property.update({
      where: {
        id,
        tenantId,
      },
      data,
    });

    reply.send(property);
  });

  // Delete property
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };

    // Vérifier s'il y a des réservations actives
    const activeBookings = await fastify.prisma.booking.count({
      where: {
        propertyId: id,
        tenantId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        checkOut: {
          gte: new Date(),
        },
      },
    });

    if (activeBookings > 0) {
      reply.status(400).send({ 
        error: 'Cannot delete property with active bookings' 
      });
      return;
    }

    await fastify.prisma.property.update({
      where: {
        id,
        tenantId,
      },
      data: {
        status: 'ARCHIVED',
      },
    });

    reply.status(204).send();
  });

  // Publish/Unpublish property
  fastify.post('/:id/publish', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: 'PUBLISHED' | 'DRAFT' };

    const property = await fastify.prisma.property.update({
      where: {
        id,
        tenantId,
      },
      data: {
        status,
      },
    });

    reply.send(property);
  });
}