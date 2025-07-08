import { PrismaClient } from '@villa-saas/database';
export interface BookingPriceCalculation {
    nights: number;
    accommodationTotal: number;
    cleaningFee: number;
    touristTax: number;
    extraFees: any[];
    discountAmount: number;
    subtotal: number;
    total: number;
    breakdown: {
        date: Date;
        price: number;
        isWeekend: boolean;
    }[];
}
export declare class BookingService {
    private prisma;
    private pricingService;
    constructor(prisma: PrismaClient);
    calculateBookingPrice(propertyId: string, checkIn: Date, checkOut: Date, guests: {
        adults: number;
        children: number;
        infants: number;
        pets: number;
    }): Promise<BookingPriceCalculation>;
    checkAvailability(propertyId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string): Promise<{
        available: boolean;
        reason?: string;
    }>;
    generateReference(): Promise<string>;
}
//# sourceMappingURL=booking.service.d.ts.map