import { PrismaClient } from '@prisma/client';
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
export declare class PricingService {
    private prisma;
    constructor(prisma: PrismaClient);
    calculatePrice(request: PricingRequest): Promise<PricingDetails>;
    checkAvailability(propertyId: string, checkIn: Date, checkOut: Date, tenantId: string, excludeBookingId?: string): Promise<boolean>;
}
export {};
//# sourceMappingURL=pricing.service.d.ts.map