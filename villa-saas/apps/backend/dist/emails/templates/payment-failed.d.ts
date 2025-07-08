import * as React from 'react';
interface PaymentFailedEmailProps {
    locale: string;
    guestName: string;
    bookingReference: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    currency?: string;
    tenantName?: string;
    tenantLogo?: string;
    retryUrl?: string;
}
export declare const PaymentFailedEmail: ({ locale, guestName, bookingReference, propertyName, checkIn, checkOut, totalAmount, currency, tenantName, tenantLogo, retryUrl, }: PaymentFailedEmailProps) => React.JSX.Element;
export default PaymentFailedEmail;
//# sourceMappingURL=payment-failed.d.ts.map