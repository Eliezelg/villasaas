"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRoutes = publicRoutes;
const zod_1 = require("zod");
const date_fns_1 = require("date-fns");
const pricing_service_1 = require("../../services/pricing.service");
const promocode_service_1 = require("../../services/promocode.service");
// Schémas de validation
const publicPropertyQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(12),
    search: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    guests: zod_1.z.coerce.number().int().positive().optional(),
    checkIn: zod_1.z.string().optional(),
    checkOut: zod_1.z.string().optional(),
    // Filters
    propertyType: zod_1.z.array(zod_1.z.string()).or(zod_1.z.string()).optional().transform((val) => {
        if (!val)
            return undefined;
        if (typeof val === 'string')
            return val.split(',');
        return val;
    }),
    // Handle both object and query string format for priceRange
    'priceRange[min]': zod_1.z.coerce.number().optional(),
    'priceRange[max]': zod_1.z.coerce.number().optional(),
    bedrooms: zod_1.z.array(zod_1.z.coerce.number()).or(zod_1.z.string()).optional().transform((val) => {
        if (!val)
            return undefined;
        if (typeof val === 'string')
            return val.split(',').map(Number);
        return val;
    }),
    amenities: zod_1.z.array(zod_1.z.string()).or(zod_1.z.string()).optional().transform((val) => {
        if (!val)
            return undefined;
        if (typeof val === 'string')
            return val.split(',');
        return val;
    }),
    atmosphere: zod_1.z.array(zod_1.z.string()).or(zod_1.z.string()).optional().transform((val) => {
        if (!val)
            return undefined;
        if (typeof val === 'string')
            return val.split(',');
        return val;
    }),
    sortBy: zod_1.z.enum(['basePrice', 'createdAt', 'name']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
const calculatePriceSchema = zod_1.z.object({
    propertyId: zod_1.z.string().min(1),
    checkIn: zod_1.z.string().datetime(),
    checkOut: zod_1.z.string().datetime(),
    guests: zod_1.z.number().int().positive(),
});
const publicBookingSchema = zod_1.z.object({
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
    guestCountry: zod_1.z.string().length(2),
    guestAddress: zod_1.z.string().optional(),
    specialRequests: zod_1.z.string().optional(),
    paymentIntentId: zod_1.z.string().optional(),
    promoCode: zod_1.z.string().optional(),
});
async function publicRoutes(fastify) {
    const pricingService = new pricing_service_1.PricingService(fastify.prisma);
    // Rate limiter pour la vérification des réservations
    const bookingVerifyLimiter = new Map();
    // Obtenir les infos d'un tenant par domaine
    fastify.get('/public/tenant-by-domain/:domain', async (request, reply) => {
        const { domain } = request.params;
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
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch tenant' });
        }
    });
    // Obtenir les infos d'un tenant par subdomain (pour l'API route Next.js)
    fastify.get('/public/tenant/:subdomain', async (request, reply) => {
        const { subdomain } = request.params;
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
        }
        catch (error) {
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
        // Check for tenant in header or query params
        const tenantSubdomain = request.headers['x-tenant'] || request.query.tenantId;
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
            const where = {
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
            let availablePropertyIds;
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
                const bookedPropertyIds = bookedProperties.map((b) => b.propertyId);
                availablePropertyIds = allProperties
                    .map((p) => p.id)
                    .filter((id) => !bookedPropertyIds.includes(id));
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
        }
        catch (error) {
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
        const { id } = request.params;
        // Check for tenant in header or query params
        const tenantSubdomain = request.headers['x-tenant'] || request.query.tenantId;
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
        }
        catch (error) {
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
        // Check for tenant in header or query params
        const tenantSubdomain = request.headers['x-tenant'] || request.query.tenantId;
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
        }
        catch (error) {
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
        const { propertyId, startDate, endDate } = request.query;
        // Check for tenant in header or query params
        const tenantSubdomain = request.headers['x-tenant'] || request.query.tenantId;
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
            const nights = (0, date_fns_1.differenceInDays)(end, start);
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
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to check availability' });
        }
    });
    // Créer une réservation publique
    fastify.post('/public/bookings', {
        schema: {
            description: 'Créer une nouvelle réservation',
            tags: ['public'],
        }
    }, async (request, reply) => {
        const validation = publicBookingSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.code(400).send({ error: validation.error });
        }
        const data = validation.data;
        // Check for tenant in header or query params
        const tenantSubdomain = request.headers['x-tenant'] || request.query.tenantId;
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
                    id: data.propertyId,
                    tenantId: tenant.id,
                    status: 'PUBLISHED',
                },
            });
            if (!property) {
                return reply.code(404).send({ error: 'Property not found' });
            }
            // Vérifier la disponibilité
            const checkInDate = new Date(data.checkIn);
            const checkOutDate = new Date(data.checkOut);
            const conflictingBooking = await fastify.prisma.booking.findFirst({
                where: {
                    propertyId: data.propertyId,
                    status: { in: ['CONFIRMED', 'PENDING'] },
                    OR: [
                        {
                            AND: [
                                { checkIn: { lte: checkOutDate } },
                                { checkOut: { gte: checkInDate } }
                            ]
                        }
                    ]
                }
            });
            if (conflictingBooking) {
                return reply.code(409).send({ error: 'Dates not available' });
            }
            // Calculer le prix total
            const pricing = await pricingService.calculatePrice({
                propertyId: data.propertyId,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                guests: data.adults + data.children,
                tenantId: tenant.id,
            });
            // Valider le code promo si fourni
            let promoCodeDiscount = 0;
            let promoCodeId = null;
            if (data.promoCode) {
                const promoValidation = await (0, promocode_service_1.validatePromoCode)(fastify.prisma, {
                    code: data.promoCode,
                    tenantId: tenant.id,
                    propertyId: data.propertyId,
                    checkIn: checkInDate,
                    checkOut: checkOutDate,
                    totalAmount: pricing.subtotal,
                    nights: pricing.nights,
                });
                if (!promoValidation.valid) {
                    return reply.code(400).send({ error: promoValidation.error });
                }
                promoCodeDiscount = promoValidation.discountAmount || 0;
                promoCodeId = promoValidation.promoCodeId || null;
            }
            // Recalculer le total avec la réduction
            const finalTotal = pricing.total - promoCodeDiscount;
            // Générer une référence unique
            const reference = `BK${Date.now().toString(36).toUpperCase()}`;
            // Créer la réservation
            const booking = await fastify.prisma.booking.create({
                data: {
                    tenantId: tenant.id,
                    propertyId: data.propertyId,
                    reference,
                    checkIn: checkInDate,
                    checkOut: checkOutDate,
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
                    specialRequests: data.specialRequests,
                    nights: pricing.nights,
                    accommodationTotal: pricing.totalAccommodation,
                    cleaningFee: pricing.cleaningFee,
                    touristTax: pricing.touristTax,
                    discountAmount: (pricing.longStayDiscount || 0) + promoCodeDiscount,
                    discountCode: data.promoCode,
                    promoCodeId: promoCodeId,
                    subtotal: pricing.subtotal,
                    total: finalTotal,
                    currency: 'EUR',
                    status: 'PENDING',
                    paymentStatus: 'PENDING',
                    stripePaymentId: data.paymentIntentId,
                    commissionRate: 0.15, // 15% commission
                    commissionAmount: finalTotal * 0.15,
                    payoutAmount: finalTotal * 0.85,
                },
                include: {
                    property: {
                        select: {
                            name: true,
                            city: true,
                            country: true,
                        }
                    }
                }
            });
            // L'email de confirmation sera envoyé après le paiement réussi via le webhook Stripe
            return booking;
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to create booking' });
        }
    });
    // Récupérer une réservation par payment intent ID
    fastify.get('/public/bookings/by-payment-intent/:paymentIntentId', {
        schema: {
            description: 'Récupérer une réservation par payment intent ID',
            tags: ['public'],
        }
    }, async (request, reply) => {
        const { paymentIntentId } = request.params;
        // Check for tenant in header or query params
        const tenantSubdomain = request.headers['x-tenant'] || request.query.tenantId;
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
            const booking = await fastify.prisma.booking.findFirst({
                where: {
                    stripePaymentId: paymentIntentId,
                    tenantId: tenant.id,
                },
                select: {
                    id: true,
                    reference: true,
                    status: true,
                    paymentStatus: true,
                    checkIn: true,
                    checkOut: true,
                    guestFirstName: true,
                    guestLastName: true,
                    guestEmail: true,
                    total: true,
                    currency: true,
                    property: {
                        select: {
                            name: true,
                            city: true,
                            country: true,
                        }
                    }
                }
            });
            if (!booking) {
                return reply.code(404).send({ error: 'Booking not found' });
            }
            return booking;
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch booking' });
        }
    });
    // Vérifier une réservation avec email + code
    fastify.post('/public/bookings/verify', {
        schema: {
            description: 'Vérifier une réservation avec email et code',
            tags: ['public'],
        }
    }, async (request, reply) => {
        const validation = zod_1.z.object({
            email: zod_1.z.string().email(),
            reference: zod_1.z.string().min(1),
        }).safeParse(request.body);
        if (!validation.success) {
            return reply.code(400).send({ error: validation.error });
        }
        const { email, reference } = validation.data;
        const clientIp = request.ip;
        // Vérifier le rate limiting
        const limiterKey = `${clientIp}:${email}`;
        const now = Date.now();
        const limiter = bookingVerifyLimiter.get(limiterKey);
        if (limiter) {
            if (now < limiter.resetAt) {
                if (limiter.attempts >= 5) {
                    return reply.code(429).send({ error: 'Too many attempts. Please try again later.' });
                }
                limiter.attempts++;
            }
            else {
                // Reset le compteur
                bookingVerifyLimiter.set(limiterKey, { attempts: 1, resetAt: now + 300000 }); // 5 minutes
            }
        }
        else {
            bookingVerifyLimiter.set(limiterKey, { attempts: 1, resetAt: now + 300000 });
        }
        try {
            // Chercher la réservation
            const booking = await fastify.prisma.booking.findFirst({
                where: {
                    guestEmail: email.toLowerCase(),
                    reference: reference.toUpperCase(),
                    status: {
                        notIn: ['CANCELLED'] // Exclure les annulées
                    }
                },
                include: {
                    property: {
                        include: {
                            images: true,
                        }
                    },
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            subdomain: true
                        }
                    }
                }
            });
            if (!booking) {
                return reply.code(404).send({ error: 'Booking not found' });
            }
            // Générer un token temporaire pour l'accès
            const token = await fastify.jwt.sign({
                userId: `guest-${booking.id}`,
                tenantId: booking.tenantId,
                email: booking.guestEmail,
                role: 'GUEST'
            }, { expiresIn: '1h' } // Token valide 1 heure
            );
            // Nettoyer les infos sensibles
            const safeBooking = {
                ...booking
            };
            return {
                booking: safeBooking,
                token
            };
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to verify booking' });
        }
    });
    // Récupérer les détails d'une réservation avec token
    fastify.get('/public/bookings/:id', {
        schema: {
            description: 'Récupérer les détails d\'une réservation',
            tags: ['public'],
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        try {
            // Vérifier le token
            const decoded = await fastify.jwt.verify(token || '');
            if (decoded.role !== 'GUEST' || !decoded.userId.startsWith('guest-')) {
                return reply.code(403).send({ error: 'Invalid token' });
            }
            // Récupérer la réservation
            const booking = await fastify.prisma.booking.findUnique({
                where: { id },
                include: {
                    property: {
                        include: {
                            images: true,
                        }
                    },
                    tenant: {
                        select: {
                            name: true,
                            email: true,
                            subdomain: true,
                        }
                    }
                }
            });
            if (!booking) {
                return reply.code(404).send({ error: 'Booking not found' });
            }
            return booking;
        }
        catch (error) {
            fastify.log.error(error);
            if (error instanceof Error && error.message.includes('jwt')) {
                return reply.code(401).send({ error: 'Invalid or expired token' });
            }
            return reply.code(500).send({ error: 'Failed to get booking details' });
        }
    });
    // Obtenir le calendrier de disponibilité public
    fastify.get('/public/availability-calendar', {
        schema: {
            description: 'Obtenir le calendrier de disponibilité publique',
            tags: ['public'],
        }
    }, async (request, reply) => {
        const { propertyId, startDate, endDate } = request.query;
        // Check for tenant in header or query params
        const tenantSubdomain = request.headers['x-tenant'] || request.query.tenantId;
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
            // Vérifier que la propriété appartient au tenant et est publiée
            const property = await fastify.prisma.property.findFirst({
                where: {
                    id: propertyId,
                    tenantId: tenant.id,
                    status: 'PUBLISHED',
                }
            });
            if (!property) {
                return reply.code(404).send({ error: 'Property not found' });
            }
            // Valider les dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return reply.code(400).send({ error: 'Invalid date format' });
            }
            if (start >= end) {
                return reply.code(400).send({ error: 'End date must be after start date' });
            }
            // Limiter à 365 jours
            const maxDays = 365;
            const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff > maxDays) {
                return reply.code(400).send({ error: `Maximum ${maxDays} days allowed` });
            }
            // Récupérer les réservations confirmées et en attente
            const bookings = await fastify.prisma.booking.findMany({
                where: {
                    propertyId,
                    tenantId: tenant.id,
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
                    checkOut: true,
                    status: true
                }
            });
            // Récupérer les périodes bloquées
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
                    endDate: true,
                    reason: true
                }
            });
            // Récupérer les périodes tarifaires
            const periods = await fastify.prisma.period.findMany({
                where: {
                    tenantId: tenant.id,
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
                let reason;
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
            return {
                propertyId,
                startDate,
                endDate,
                dates
            };
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch availability calendar' });
        }
    });
}
//# sourceMappingURL=public.routes.js.map