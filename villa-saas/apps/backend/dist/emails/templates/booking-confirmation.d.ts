import * as React from 'react';
interface BookingConfirmationEmailProps {
    locale: string;
    bookingReference: string;
    guestName: string;
    guestEmail: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalAmount: number;
    currency?: string;
    propertyImage?: string;
    tenantName?: string;
    tenantLogo?: string;
    tenantSubdomain?: string;
}
export declare const BookingConfirmationEmail: ({ locale, bookingReference, guestName, guestEmail, propertyName, checkIn, checkOut, guests, totalAmount, currency, propertyImage, tenantName, tenantLogo, tenantSubdomain, }: BookingConfirmationEmailProps) => React.JSX.Element;
export default BookingConfirmationEmail;
//# sourceMappingURL=booking-confirmation.d.ts.map