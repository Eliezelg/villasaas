import { FastifyInstance } from 'fastify';
export interface EmailService {
    sendBookingConfirmation(params: BookingConfirmationParams): Promise<void>;
    sendPaymentFailedNotification(params: PaymentFailedParams): Promise<void>;
    sendBookingCancellation(params: BookingCancellationParams): Promise<void>;
    sendBookingNotificationToOwner(params: OwnerNotificationParams): Promise<void>;
    sendCheckInReminder(params: CheckInReminderParams): Promise<void>;
    sendCheckInInstructions(params: CheckInInstructionsParams): Promise<void>;
    sendReviewRequest(params: ReviewRequestParams): Promise<void>;
}
interface BookingConfirmationParams {
    to: string;
    bookingReference: string;
    guestName: string;
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
    locale?: string;
}
interface PaymentFailedParams {
    to: string;
    bookingReference: string;
    guestName: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    currency?: string;
    tenantName?: string;
    tenantLogo?: string;
    retryUrl?: string;
    locale?: string;
}
interface BookingCancellationParams {
    to: string;
    bookingReference: string;
    guestName: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    tenantName?: string;
    tenantLogo?: string;
    locale?: string;
}
interface OwnerNotificationParams {
    to: string;
    bookingReference: string;
    propertyName: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalAmount: number;
}
interface CheckInReminderParams {
    to: string;
    guestName: string;
    propertyName: string;
    checkIn: string;
    bookingReference: string;
}
interface CheckInInstructionsParams {
    to: string;
    guestName: string;
    propertyName: string;
    propertyAddress: string;
    checkInTime: string;
    accessCode?: string;
    instructions: string;
}
interface ReviewRequestParams {
    to: string;
    guestName: string;
    propertyName: string;
    reviewLink: string;
}
export declare class ResendEmailService implements EmailService {
    private resend;
    private fromEmail;
    private fastify;
    constructor(fastify: FastifyInstance);
    sendBookingConfirmation(params: BookingConfirmationParams): Promise<void>;
    sendPaymentFailedNotification(params: PaymentFailedParams): Promise<void>;
    sendBookingCancellation(params: BookingCancellationParams): Promise<void>;
    sendBookingNotificationToOwner(params: OwnerNotificationParams): Promise<void>;
    sendCheckInReminder(params: CheckInReminderParams): Promise<void>;
    sendCheckInInstructions(params: CheckInInstructionsParams): Promise<void>;
    sendReviewRequest(params: ReviewRequestParams): Promise<void>;
}
export declare class MockEmailService implements EmailService {
    private fastify;
    constructor(fastify: FastifyInstance);
    sendBookingConfirmation(params: BookingConfirmationParams): Promise<void>;
    sendPaymentFailedNotification(params: PaymentFailedParams): Promise<void>;
    sendBookingCancellation(params: BookingCancellationParams): Promise<void>;
    sendBookingNotificationToOwner(params: OwnerNotificationParams): Promise<void>;
    sendCheckInReminder(params: CheckInReminderParams): Promise<void>;
    sendCheckInInstructions(params: CheckInInstructionsParams): Promise<void>;
    sendReviewRequest(params: ReviewRequestParams): Promise<void>;
}
export declare function createEmailService(fastify: FastifyInstance): EmailService;
export {};
//# sourceMappingURL=email.service.d.ts.map