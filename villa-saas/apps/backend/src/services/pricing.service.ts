import { PrismaClient } from '@prisma/client';
import { addDays, differenceInDays, isWeekend, eachDayOfInterval } from 'date-fns';

interface PricingRequest {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  tenantId: string;
}

interface PricingDetails {
  nights: number;
  basePrice: number;
  totalAccommodation: number;
  weekendPremium: number;
  seasonalAdjustment: number;
  longStayDiscount: number;
  cleaningFee: number;
  touristTax: number;
  subtotal: number;
  total: number;
  averagePricePerNight: number;
  breakdown: DailyBreakdown[];
}

interface DailyBreakdown {
  date: string;
  basePrice: number;
  weekendPremium: number;
  finalPrice: number;
  periodName?: string;
}

export class PricingService {
  constructor(private prisma: PrismaClient) {}

  async calculatePrice(request: PricingRequest): Promise<PricingDetails> {
    // Récupérer la propriété
    const property = await this.prisma.property.findFirst({
      where: {
        id: request.propertyId,
        tenantId: request.tenantId,
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Vérifier le nombre de voyageurs
    if (request.guests > property.maxGuests) {
      throw new Error(`Maximum ${property.maxGuests} guests allowed`);
    }

    // Calculer le nombre de nuits
    const nights = differenceInDays(request.checkOut, request.checkIn);
    if (nights < 1) {
      throw new Error('Invalid dates');
    }

    // Récupérer les périodes tarifaires actives
    const periods = await this.prisma.period.findMany({
      where: {
        tenantId: request.tenantId,
        OR: [
          { propertyId: request.propertyId },
          { propertyId: null }, // Périodes globales du tenant
        ],
        isActive: true,
        startDate: { lte: request.checkOut },
        endDate: { gte: request.checkIn },
      },
      orderBy: [
        { propertyId: 'desc' }, // Priorité aux périodes spécifiques à la propriété
        { priority: 'desc' },
      ],
    });

    // Calculer le prix pour chaque nuit
    const breakdown: DailyBreakdown[] = [];
    let totalAccommodation = 0;
    let totalWeekendPremium = 0;

    const dateRange = eachDayOfInterval({
      start: request.checkIn,
      end: addDays(request.checkOut, -1), // Exclure la date de départ
    });

    for (const date of dateRange) {
      // Trouver la période applicable pour cette date
      const applicablePeriod = periods.find(
        period => date >= new Date(period.startDate) && date <= new Date(period.endDate)
      );

      // Utiliser le prix de la période ou le prix de base de la propriété
      const basePrice = applicablePeriod?.basePrice || property.basePrice;
      const weekendPremiumRate = applicablePeriod?.weekendPremium || property.weekendPremium || 0;

      // Calculer le supplément weekend
      const isWeekendDay = isWeekend(date);
      const weekendPremium = isWeekendDay ? weekendPremiumRate : 0;

      const finalPrice = basePrice + weekendPremium;
      totalAccommodation += finalPrice;
      totalWeekendPremium += weekendPremium;

      breakdown.push({
        date: date.toISOString().split('T')[0],
        basePrice,
        weekendPremium,
        finalPrice,
        periodName: applicablePeriod?.name,
      });
    }

    // Calculer la réduction long séjour
    let longStayDiscount = 0;
    let discountRate = 0;

    if (nights >= 28) {
      discountRate = 0.10; // 10% pour 28+ nuits
    } else if (nights >= 7) {
      discountRate = 0.05; // 5% pour 7+ nuits
    }

    longStayDiscount = Math.round(totalAccommodation * discountRate * 100) / 100;

    // Vérifier la durée minimum de séjour
    const minNightsRequired = Math.max(
      property.minNights,
      ...periods.map(p => p.minNights).filter(Boolean)
    );

    if (nights < minNightsRequired) {
      throw new Error(`Minimum stay is ${minNightsRequired} nights for these dates`);
    }

    // Calculer la taxe de séjour (exemple: 1€ par personne par nuit)
    const touristTaxPerPersonPerNight = 1; // À paramétrer selon la localisation
    const touristTax = request.guests * nights * touristTaxPerPersonPerNight;

    // Calculer les totaux
    const subtotal = totalAccommodation - longStayDiscount + (property.cleaningFee || 0);
    const total = subtotal + touristTax;

    return {
      nights,
      basePrice: property.basePrice,
      totalAccommodation,
      weekendPremium: totalWeekendPremium,
      seasonalAdjustment: totalAccommodation - (property.basePrice * nights),
      longStayDiscount,
      cleaningFee: property.cleaningFee || 0,
      touristTax,
      subtotal,
      total,
      averagePricePerNight: Math.round(total / nights * 100) / 100,
      breakdown,
    };
  }

  async checkAvailability(
    propertyId: string, 
    checkIn: Date, 
    checkOut: Date,
    tenantId: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    const conflictingBookings = await this.prisma.booking.count({
      where: {
        propertyId,
        tenantId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOut } },
              { checkOut: { gt: checkIn } },
            ],
          },
        ],
      },
    });

    return conflictingBookings === 0;
  }
}