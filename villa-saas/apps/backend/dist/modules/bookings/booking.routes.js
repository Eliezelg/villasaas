"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRoutes = bookingRoutes;
const zod_1 = require("zod");
const utils_1 = require("@villa-saas/utils");
const booking_service_1 = require("./booking.service");
const email_service_1 = require("../../services/email.service");
// Schémas de validation
const createBookingSchema = zod_1.z.object({
    propertyId: zod_1.z.string().min(1),
    checkIn: zod_1.z.string().datetime(),
    checkOut: zod_1.z.string().datetime(),
    adults: zod_1.z.number().int().positive(),
    children: zod_1.z.number().int().min(0).default(0),
    infants: zod_1.z.number().int().min(0).default(0),
    pets: zod_1.z.number().int().min(0).default(0),
    guestFirstName: zod_1.z.string().min(1),
    guestLastName: zod_1.z.string().min(1),
    guestEmail: zod_1.z.string().email(),
    guestPhone: zod_1.z.string().min(1),
    guestCountry: zod_1.z.string().optional(),
    guestAddress: zod_1.z.string().optional(),
    guestNotes: zod_1.z.string().optional(),
    specialRequests: zod_1.z.string().optional(),
    source: zod_1.z.string().optional(),
    externalId: zod_1.z.string().optional(),
    selectedOptions: zod_1.z.array(zod_1.z.object({
        optionId: zod_1.z.string().min(1),
        quantity: zod_1.z.number().int().positive()
    })).optional(),
});
const updateBookingSchema = zod_1.z.object({
    guestFirstName: zod_1.z.string().min(1).optional(),
    guestLastName: zod_1.z.string().min(1).optional(),
    guestEmail: zod_1.z.string().email().optional(),
    guestPhone: zod_1.z.string().min(1).optional(),
    guestCountry: zod_1.z.string().optional(),
    guestAddress: zod_1.z.string().optional(),
    guestNotes: zod_1.z.string().optional(),
    specialRequests: zod_1.z.string().optional(),
    internalNotes: zod_1.z.string().optional(),
});
const bookingFiltersSchema = zod_1.z.object({
    propertyId: zod_1.z.string().min(1).optional(),
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    sortBy: zod_1.z.enum(['createdAt', 'checkIn', 'checkOut', 'total']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
async function bookingRoutes(fastify) {
    const bookingService = new booking_service_1.BookingService(fastify.prisma);
    // Calculer le prix d'une réservation
    fastify.post('/bookings/calculate-price', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Calculer le prix d\'une réservation',
            tags: ['bookings'],
        }
    }, async (request, reply) => {
        const validation = zod_1.z.object({
            propertyId: zod_1.z.string().min(1),
            checkIn: zod_1.z.string().datetime(),
            checkOut: zod_1.z.string().datetime(),
            adults: zod_1.z.number().int().positive(),
            children: zod_1.z.number().int().min(0).default(0),
            infants: zod_1.z.number().int().min(0).default(0),
            pets: zod_1.z.number().int().min(0).default(0),
        }).safeParse(request.body);
        if (!validation.success) {
            return reply.code(400).send({ error: validation.error });
        }
        const data = validation.data;
        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);
        try {
            // Vérifier la disponibilité
            const availability = await bookingService.checkAvailability(data.propertyId, checkIn, checkOut);
            if (!availability.available) {
                return reply.code(409).send({
                    error: availability.reason,
                    available: false
                });
            }
            // Calculer le prix
            const priceCalculation = await bookingService.calculateBookingPrice(data.propertyId, checkIn, checkOut, {
                adults: data.adults,
                children: data.children,
                infants: data.infants,
                pets: data.pets
            });
            return reply.send({
                available: true,
                ...priceCalculation,
                commission: {
                    rate: 0.15,
                    amount: priceCalculation.total * 0.15
                }
            });
        }
        catch (error) {
            return reply.code(400).send({ error: error.message });
        }
    });
    // Créer une réservation
    fastify.post('/bookings', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Créer une nouvelle réservation',
            tags: ['bookings'],
        }
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
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
        const availability = await bookingService.checkAvailability(data.propertyId, checkIn, checkOut);
        if (!availability.available) {
            return reply.code(409).send({ error: availability.reason });
        }
        // Calculer le prix total
        const priceCalculation = await bookingService.calculateBookingPrice(data.propertyId, checkIn, checkOut, {
            adults: data.adults,
            children: data.children,
            infants: data.infants,
            pets: data.pets
        });
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
    });
    // Lister les réservations
    fastify.get('/bookings', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Lister les réservations',
            tags: ['bookings'],
        }
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        // Valider les filtres
        const validation = bookingFiltersSchema.safeParse(request.query);
        if (!validation.success) {
            return reply.code(400).send({ error: validation.error });
        }
        const filters = validation.data;
        const skip = (filters.page - 1) * filters.limit;
        // Construire la requête
        const where = { tenantId };
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
    });
    // Obtenir une réservation
    fastify.get('/bookings/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Obtenir une réservation',
            tags: ['bookings'],
        }
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
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
    });
    // Mettre à jour une réservation
    fastify.patch('/bookings/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Mettre à jour une réservation',
            tags: ['bookings'],
        }
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
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
    });
    // Update booking status
    fastify.patch('/bookings/:id/status', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Update booking status',
            tags: ['bookings'],
        }
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { id } = request.params;
        const { status } = request.body;
        // Validate status
        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
        if (!validStatuses.includes(status)) {
            return reply.code(400).send({ error: 'Invalid status' });
        }
        const booking = await fastify.prisma.booking.findFirst({
            where: { id, tenantId }
        });
        if (!booking) {
            return reply.code(404).send({ error: 'Booking not found' });
        }
        const updated = await fastify.prisma.booking.update({
            where: { id },
            data: { status: status },
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
    });
    // Confirmer une réservation
    fastify.post('/bookings/:id/confirm', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Confirmer une réservation',
            tags: ['bookings'],
        }
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
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
                        images: {
                            select: {
                                id: true,
                                url: true,
                                urls: true,
                                order: true
                            }
                        }
                    }
                }
            }
        });
        // Récupérer les informations du tenant avec le site public
        const tenant = await fastify.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                name: true,
                subdomain: true,
                publicSite: {
                    select: {
                        logo: true
                    }
                }
            }
        });
        // Envoyer email de confirmation
        try {
            const emailService = (0, email_service_1.createEmailService)(fastify);
            await emailService.sendBookingConfirmation({
                to: updated.guestEmail,
                bookingReference: updated.reference,
                guestName: `${updated.guestFirstName} ${updated.guestLastName}`,
                propertyName: updated.property.name,
                checkIn: updated.checkIn.toLocaleDateString('fr-FR'),
                checkOut: updated.checkOut.toLocaleDateString('fr-FR'),
                guests: updated.adults + updated.children,
                totalAmount: updated.total,
                currency: updated.currency,
                propertyImage: updated.property.images?.[0]?.urls?.large || updated.property.images?.[0]?.url,
                tenantName: tenant?.name,
                tenantLogo: tenant?.publicSite?.logo || undefined,
                tenantSubdomain: tenant?.subdomain || undefined,
                locale: updated.guestCountry === 'GB' || updated.guestCountry === 'US' ? 'en' : 'fr'
            });
        }
        catch (emailError) {
            // Log l'erreur mais ne pas faire échouer la confirmation
            fastify.log.error({ emailError }, 'Failed to send confirmation email after booking confirmation');
        }
        return reply.send(updated);
    });
    // Annuler une réservation
    fastify.post('/bookings/:id/cancel', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Annuler une réservation',
            tags: ['bookings'],
        }
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
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
    });
    // Statistiques des réservations
    fastify.get('/bookings/stats', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Obtenir les statistiques des réservations',
            tags: ['bookings'],
        }
    }, async (request, reply) => {
        const tenantId = (0, utils_1.getTenantId)(request);
        const { propertyId, startDate, endDate } = request.query;
        const where = { tenantId };
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
        const [totalBookings, confirmedBookings, cancelledBookings, totalRevenue, averageStay] = await Promise.all([
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
    });
}
//# sourceMappingURL=booking.routes.js.map