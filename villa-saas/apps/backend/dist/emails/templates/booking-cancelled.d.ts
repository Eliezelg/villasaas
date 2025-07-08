import * as React from 'react';
interface BookingCancelledEmailProps {
    locale: string;
    guestName: string;
    bookingReference: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    tenantName?: string;
    tenantLogo?: string;
}
export declare const BookingCancelledEmail: ({ locale, guestName, bookingReference, propertyName, checkIn, checkOut, tenantName, tenantLogo, }: BookingCancelledEmailProps) => React.JSX.Element;
export default BookingCancelledEmail;
//# sourceMappingURL=booking-cancelled.d.ts.map