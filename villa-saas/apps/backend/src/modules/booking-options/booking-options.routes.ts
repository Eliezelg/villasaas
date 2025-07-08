import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@villa-saas/database';
import { getTenantId } from '@villa-saas/utils';
import { 
  createBookingOptionSchema, 
  updateBookingOptionSchema,
  propertyBookingOptionSchema,
  paymentConfigurationSchema,
  updatePaymentConfigurationSchema
} from '@villa-saas/types';

export async function bookingOptionsRoutes(fastify: FastifyInstance) {
  // ==================== BOOKING OPTIONS ====================
  
  // Récupérer toutes les options du tenant
  fastify.get('/booking-options', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    
    const options = await prisma.bookingOption.findMany({
      where: { tenantId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    
    return reply.send({ data: options });
  });

  // Récupérer une option spécifique
  fastify.get('/booking-options/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const validation = z.object({
      id: z.string().min(1)
    }).safeParse(request.params);
    
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }
    
    const { id } = validation.data;
    const tenantId = getTenantId(request);
    
    const option = await prisma.bookingOption.findFirst({
      where: { id, tenantId },
      include: {
        properties: {
          include: {
            property: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!option) {
      return reply.code(404).send({ error: 'Option not found' });
    }
    
    return reply.send({ data: option });
  });

  // Créer une nouvelle option
  fastify.post('/booking-options', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const validation = createBookingOptionSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }
    
    const tenantId = getTenantId(request);
    
    const option = await prisma.bookingOption.create({
      data: {
        ...validation.data,
        tenantId
      }
    });
    
    return reply.code(201).send({ data: option });
  });

  // Mettre à jour une option
  fastify.patch('/booking-options/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsValidation = z.object({
      id: z.string().min(1)
    }).safeParse(request.params);
    
    if (!paramsValidation.success) {
      return reply.code(400).send({ error: paramsValidation.error });
    }
    
    const bodyValidation = updateBookingOptionSchema.safeParse(request.body);
    
    if (!bodyValidation.success) {
      return reply.code(400).send({ error: bodyValidation.error });
    }
    
    const { id } = paramsValidation.data;
    const tenantId = getTenantId(request);
    
    // Vérifier que l'option appartient au tenant
    const existing = await prisma.bookingOption.findFirst({
      where: { id, tenantId }
    });
    
    if (!existing) {
      return reply.code(404).send({ error: 'Option not found' });
    }
    
    const option = await prisma.bookingOption.update({
      where: { id },
      data: bodyValidation.data
    });
    
    return reply.send({ data: option });
  });

  // Supprimer une option
  fastify.delete('/booking-options/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const validation = z.object({
      id: z.string().min(1)
    }).safeParse(request.params);
    
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }
    
    const { id } = validation.data;
    const tenantId = getTenantId(request);
    
    // Vérifier que l'option appartient au tenant
    const existing = await prisma.bookingOption.findFirst({
      where: { id, tenantId }
    });
    
    if (!existing) {
      return reply.code(404).send({ error: 'Option not found' });
    }
    
    // Vérifier qu'aucune réservation n'utilise cette option
    const usedInBookings = await prisma.bookingSelectedOption.findFirst({
      where: { optionId: id }
    });
    
    if (usedInBookings) {
      return reply.code(400).send({ 
        error: 'Cannot delete option used in bookings' 
      });
    }
    
    await prisma.bookingOption.delete({
      where: { id }
    });
    
    return reply.code(204).send();
  });

  // ==================== PROPERTY BOOKING OPTIONS ====================
  
  // Récupérer les options d'une propriété
  fastify.get('/properties/:propertyId/booking-options', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const validation = z.object({
      propertyId: z.string().min(1)
    }).safeParse(request.params);
    
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }
    
    const { propertyId } = validation.data;
    const tenantId = getTenantId(request);
    
    // Vérifier que la propriété appartient au tenant
    const property = await prisma.property.findFirst({
      where: { id: propertyId, tenantId }
    });
    
    if (!property) {
      return reply.code(404).send({ error: 'Property not found' });
    }
    
    // Récupérer toutes les options du tenant avec leur statut pour cette propriété
    const allOptions = await prisma.bookingOption.findMany({
      where: { tenantId, isActive: true },
      include: {
        properties: {
          where: { propertyId },
          select: {
            customPrice: true,
            customMinQuantity: true,
            customMaxQuantity: true,
            isEnabled: true
          }
        }
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    
    return reply.send({ data: allOptions });
  });

  // Associer/modifier une option à une propriété
  fastify.put('/properties/:propertyId/booking-options/:optionId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsValidation = z.object({
      propertyId: z.string().min(1),
      optionId: z.string().min(1)
    }).safeParse(request.params);
    
    if (!paramsValidation.success) {
      return reply.code(400).send({ error: paramsValidation.error });
    }
    
    const bodyValidation = z.object({
      customPrice: z.number().positive().optional(),
      customMinQuantity: z.number().int().min(0).optional(),
      customMaxQuantity: z.number().int().positive().optional(),
      isEnabled: z.boolean().default(true)
    }).safeParse(request.body);
    
    if (!bodyValidation.success) {
      return reply.code(400).send({ error: bodyValidation.error });
    }
    
    const { propertyId, optionId } = paramsValidation.data;
    const tenantId = getTenantId(request);
    
    // Vérifier que la propriété et l'option appartiennent au tenant
    const [property, option] = await Promise.all([
      prisma.property.findFirst({ where: { id: propertyId, tenantId } }),
      prisma.bookingOption.findFirst({ where: { id: optionId, tenantId } })
    ]);
    
    if (!property || !option) {
      return reply.code(404).send({ error: 'Property or option not found' });
    }
    
    const propertyOption = await prisma.propertyBookingOption.upsert({
      where: {
        propertyId_optionId: {
          propertyId,
          optionId
        }
      },
      create: {
        propertyId,
        optionId,
        ...bodyValidation.data
      },
      update: bodyValidation.data
    });
    
    return reply.send({ data: propertyOption });
  });

  // Désactiver une option pour une propriété
  fastify.delete('/properties/:propertyId/booking-options/:optionId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const validation = z.object({
      propertyId: z.string().min(1),
      optionId: z.string().min(1)
    }).safeParse(request.params);
    
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }
    
    const { propertyId, optionId } = validation.data;
    const tenantId = getTenantId(request);
    
    // Vérifier que la propriété appartient au tenant
    const property = await prisma.property.findFirst({
      where: { id: propertyId, tenantId }
    });
    
    if (!property) {
      return reply.code(404).send({ error: 'Property not found' });
    }
    
    await prisma.propertyBookingOption.updateMany({
      where: { propertyId, optionId },
      data: { isEnabled: false }
    });
    
    return reply.code(204).send();
  });

  // ==================== PAYMENT CONFIGURATION ====================
  
  // Récupérer la configuration des paiements
  fastify.get('/payment-configuration', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    
    let config = await prisma.paymentConfiguration.findUnique({
      where: { tenantId }
    });
    
    // Créer une configuration par défaut si elle n'existe pas
    if (!config) {
      config = await prisma.paymentConfiguration.create({
        data: {
          tenantId,
          depositType: 'PERCENTAGE',
          depositValue: 30, // 30% par défaut
          depositDueDate: 'AT_BOOKING',
          touristTaxEnabled: false,
          serviceFeeEnabled: false,
          allowPartialPayment: true,
          balanceDueDays: 7
        }
      });
    }
    
    return reply.send({ data: config });
  });

  // Mettre à jour la configuration des paiements
  fastify.put('/payment-configuration', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const validation = paymentConfigurationSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }
    
    const tenantId = getTenantId(request);
    
    const config = await prisma.paymentConfiguration.upsert({
      where: { tenantId },
      create: {
        ...validation.data,
        tenantId
      },
      update: validation.data
    });
    
    return reply.send({ data: config });
  });

  // Mettre à jour partiellement la configuration des paiements
  fastify.patch('/payment-configuration', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const validation = updatePaymentConfigurationSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }
    
    const tenantId = getTenantId(request);
    
    // Vérifier que la configuration existe
    const existing = await prisma.paymentConfiguration.findUnique({
      where: { tenantId }
    });
    
    if (!existing) {
      return reply.code(404).send({ 
        error: 'Payment configuration not found. Use PUT to create it first.' 
      });
    }
    
    const config = await prisma.paymentConfiguration.update({
      where: { tenantId },
      data: validation.data
    });
    
    return reply.send({ data: config });
  });
}