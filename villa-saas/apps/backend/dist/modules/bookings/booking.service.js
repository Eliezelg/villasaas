"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const date_fns_1 = require("date-fns");
const pricing_service_1 = require("../../services/pricing.service");
class BookingService {
    prisma;
    pricingService;
    constructor(prisma) {
        this.prisma = prisma;
        this.pricingService = new pricing_service_1.PricingService(prisma);
    }
    async calculateBookingPrice(propertyId, checkIn, checkOut, guests) {
        // Récupérer la propriété avec ses périodes de tarification
        const property = await this.prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                periods: {
                    where: { isActive: true },
                    orderBy: { priority: 'desc' }
                }
            }
        });
        if (!property) {
            throw new Error('Property not found');
        }
        // Calculer le nombre de nuits
        const nights = (0, date_fns_1.differenceInDays)(checkOut, checkIn);
        if (nights <= 0) {
            throw new Error('Invalid dates');
        }
        // Vérifier le nombre d'invités
        const totalGuests = guests.adults + guests.children;
        if (totalGuests > property.maxGuests) {
            throw new Error(`Maximum ${property.maxGuests} guests allowed`);
        }
        // Obtenir les prix pour chaque nuit
        const dates = (0, date_fns_1.eachDayOfInterval)({ start: checkIn, end: (0, date_fns_1.addDays)(checkOut, -1) });
        const breakdown = [];
        let accommodationTotal = 0;
        // Calculer le prix pour toute la période
        const pricingDetails = await this.pricingService.calculatePrice({
            propertyId,
            checkIn,
            checkOut,
            guests: guests.adults + guests.children,
            tenantId: property.tenantId
        });
        // Utiliser le breakdown du pricing service
        for (const day of pricingDetails.breakdown) {
            breakdown.push({
                date: new Date(day.date),
                price: day.finalPrice,
                isWeekend: day.weekendPremium > 0
            });
        }
        accommodationTotal = pricingDetails.totalAccommodation;
        // Appliquer les réductions long séjour
        let discountAmount = 0;
        if (nights >= 28) {
            discountAmount = accommodationTotal * 0.10; // 10% pour 28+ nuits
        }
        else if (nights >= 7) {
            discountAmount = accommodationTotal * 0.05; // 5% pour 7+ nuits
        }
        // Frais additionnels
        const cleaningFee = property.cleaningFee || 0;
        // Taxe de séjour (exemple simple : 1€ par adulte par nuit)
        const touristTax = guests.adults * nights * 1;
        // Frais supplémentaires (animaux, etc.)
        const extraFees = [];
        if (guests.pets > 0 && property.petsAllowed) {
            extraFees.push({
                name: 'Supplément animaux',
                amount: guests.pets * 20 // 20€ par animal
            });
        }
        const extraFeesTotal = extraFees.reduce((sum, fee) => sum + fee.amount, 0);
        // Calculs finaux
        const subtotal = accommodationTotal + cleaningFee + touristTax + extraFeesTotal;
        const total = subtotal - discountAmount;
        return {
            nights,
            accommodationTotal,
            cleaningFee,
            touristTax,
            extraFees,
            discountAmount,
            subtotal,
            total,
            breakdown
        };
    }
    async checkAvailability(propertyId, checkIn, checkOut, excludeBookingId) {
        // Vérifier les réservations existantes
        const conflictingBooking = await this.prisma.booking.findFirst({
            where: {
                propertyId,
                id: excludeBookingId ? { not: excludeBookingId } : undefined,
                status: { in: ['CONFIRMED', 'PENDING'] },
                OR: [
                    {
                        AND: [
                            { checkIn: { lte: checkOut } },
                            { checkOut: { gte: checkIn } }
                        ]
                    }
                ]
            }
        });
        if (conflictingBooking) {
            return { available: false, reason: 'Dates already booked' };
        }
        // Vérifier les périodes bloquées
        const blockedPeriod = await this.prisma.blockedPeriod.findFirst({
            where: {
                propertyId,
                OR: [
                    {
                        AND: [
                            { startDate: { lte: checkOut } },
                            { endDate: { gte: checkIn } }
                        ]
                    }
                ]
            }
        });
        if (blockedPeriod) {
            return { available: false, reason: blockedPeriod.reason || 'Dates blocked' };
        }
        // Vérifier la durée minimum de séjour
        const nights = (0, date_fns_1.differenceInDays)(checkOut, checkIn);
        // Récupérer la propriété pour vérifier la durée minimum
        const property = await this.prisma.property.findFirst({
            where: { id: propertyId },
            include: {
                periods: {
                    where: {
                        isActive: true,
                        startDate: { lte: checkOut },
                        endDate: { gte: checkIn }
                    }
                }
            }
        });
        if (!property) {
            return { available: false, reason: 'Property not found' };
        }
        // Trouver la durée minimum applicable
        const applicablePeriod = property.periods.find(period => checkIn >= new Date(period.startDate) && checkIn <= new Date(period.endDate));
        const minNights = applicablePeriod?.minNights || property.minNights;
        if (minNights && nights < minNights) {
            return {
                available: false,
                reason: `Minimum stay of ${minNights} nights required`
            };
        }
        return { available: true };
    }
    async generateReference() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        // Trouver le dernier numéro de référence pour ce mois
        const lastBooking = await this.prisma.booking.findFirst({
            where: {
                reference: {
                    startsWith: `VS${year}${month}`
                }
            },
            orderBy: { reference: 'desc' }
        });
        let sequence = 1;
        if (lastBooking) {
            const lastSequence = parseInt(lastBooking.reference.slice(-4));
            sequence = lastSequence + 1;
        }
        return `VS${year}${month}${sequence.toString().padStart(4, '0')}`;
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=booking.service.js.map