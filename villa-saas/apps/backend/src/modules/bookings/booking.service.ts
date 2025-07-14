import { PrismaClient } from '@villa-saas/database';
import { differenceInDays } from 'date-fns';
import { PricingService } from '../../services/pricing.service';

export interface BookingPriceCalculation {
  nights: number;
  accommodationTotal: number;
  cleaningFee: number;
  touristTax: number;
  extraFees: any[];
  discountAmount: number;
  optionsTotal: number;
  depositAmount: number;
  subtotal: number;
  total: number;
  breakdown: {
    date: Date;
    price: number;
    isWeekend: boolean;
  }[];
  selectedOptions?: Array<{
    optionId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export class BookingService {
  private prisma: PrismaClient;
  private pricingService: PricingService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.pricingService = new PricingService(prisma);
  }

  async calculateBookingPrice(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    guests: { adults: number; children: number; infants: number; pets: number },
    selectedOptions?: Array<{ optionId: string; quantity: number }>
  ): Promise<BookingPriceCalculation> {
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
    const nights = differenceInDays(checkOut, checkIn);
    if (nights <= 0) {
      throw new Error('Invalid dates');
    }

    // Vérifier le nombre d'invités
    const totalGuests = guests.adults + guests.children;
    if (totalGuests > property.maxGuests) {
      throw new Error(`Maximum ${property.maxGuests} guests allowed`);
    }

    // Obtenir les prix pour chaque nuit
    const breakdown: any[] = [];
    let accommodationTotal = 0;

    // Calculer le prix pour toute la période
    const pricingDetails = await this.pricingService.calculatePrice({
      propertyId,
      checkIn,
      checkOut,
      guests: guests.adults + guests.children,
      adults: guests.adults,
      children: guests.children,
      tenantId: property.tenantId,
      selectedOptions
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

    // Utiliser les détails du service de pricing
    const discountAmount = pricingDetails.longStayDiscount;
    const cleaningFee = pricingDetails.cleaningFee;
    const touristTax = pricingDetails.touristTax;
    const optionsTotal = pricingDetails.optionsTotal;
    const depositAmount = pricingDetails.depositAmount;
    
    // Frais supplémentaires (animaux, etc.)
    const extraFees: any[] = [];
    if (guests.pets > 0 && (property.amenities as any)?.petsAllowed) {
      extraFees.push({
        name: 'Supplément animaux',
        amount: guests.pets * 20 // 20€ par animal
      });
    }

    const extraFeesTotal = extraFees.reduce((sum, fee) => sum + fee.amount, 0);

    // Calculs finaux
    const subtotal = accommodationTotal + cleaningFee + touristTax + extraFeesTotal + optionsTotal;
    const total = subtotal - discountAmount;

    return {
      nights,
      accommodationTotal,
      cleaningFee,
      touristTax,
      extraFees,
      discountAmount,
      optionsTotal,
      depositAmount,
      subtotal,
      total,
      breakdown,
      selectedOptions: pricingDetails.selectedOptions
    };
  }

  async checkAvailability(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string
  ): Promise<{ available: boolean; reason?: string }> {
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
    const nights = differenceInDays(checkOut, checkIn);
    
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
    const applicablePeriod = property.periods.find(
      period => checkIn >= new Date(period.startDate) && checkIn <= new Date(period.endDate)
    );
    
    const minNights = applicablePeriod?.minNights || property.minNights;
    
    if (minNights && nights < minNights) {
      return { 
        available: false, 
        reason: `Minimum stay of ${minNights} nights required` 
      };
    }

    return { available: true };
  }

  async generateReference(): Promise<string> {
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