import { PrismaClient } from '@prisma/client';
interface ValidatePromoCodeParams {
    code: string;
    tenantId: string;
    propertyId: string;
    checkIn: Date;
    checkOut: Date;
    totalAmount: number;
    nights: number;
    userId?: string;
}
export declare function validatePromoCode(prisma: PrismaClient, params: ValidatePromoCodeParams): Promise<{
    valid: boolean;
    error: string;
    promoCodeId?: undefined;
    code?: undefined;
    description?: undefined;
    discountType?: undefined;
    discountValue?: undefined;
    discountAmount?: undefined;
    finalAmount?: undefined;
} | {
    valid: boolean;
    promoCodeId: string;
    code: string;
    description: string | null;
    discountType: import(".prisma/client").$Enums.DiscountType;
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
    error?: undefined;
}>;
export declare function applyPromoCode(prisma: PrismaClient, promoCodeId: string): Promise<void>;
export {};
//# sourceMappingURL=promocode.service.d.ts.map