import { PrismaClient } from '@prisma/client';
interface PricingRequest {
    propertyId: string;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    adults?: number;
    children?: number;
    tenantId: string;
    selectedOptions?: Array<{
        optionId: string;
        quantity: number;
    }>;
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
    optionsTotal: number;
    depositAmount: number;
    subtotal: number;
    total: number;
    averagePricePerNight: number;
    breakdown: DailyBreakdown[];
    selectedOptions?: Array<{
        optionId: string;
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
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