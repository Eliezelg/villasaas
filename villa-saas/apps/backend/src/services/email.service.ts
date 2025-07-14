import { render } from '@react-email/components';
import { Resend } from 'resend';
import { FastifyInstance } from 'fastify';
import BookingConfirmationEmail from '../emails/templates/booking-confirmation.js';
import PaymentFailedEmail from '../emails/templates/payment-failed.js';
import BookingCancelledEmail from '../emails/templates/booking-cancelled.js';
import { I18nEmailService } from './i18n-email.service';

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

export class ResendEmailService implements EmailService {
  private resend: Resend;
  private fromEmail: string;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.resend = fastify.resend;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@villa-saas.com';
  }

  async sendBookingConfirmation(params: BookingConfirmationParams): Promise<void> {
    try {
      const locale = params.locale || 'fr';
      const i18n = new I18nEmailService(locale);
      
      // Préparer les paramètres du template avec l'email du client
      const templateParams = {
        ...params,
        locale,
        guestEmail: params.to, // Ajouter l'email pour la génération du lien
      };
      
      const emailHtml = await render(BookingConfirmationEmail(templateParams));
      const subject = i18n.t('emails.bookingConfirmation.subject', { reference: params.bookingReference });

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject,
        html: emailHtml as string,
      });

      if (error) {
        this.fastify.log.error({ error }, 'Failed to send booking confirmation email');
        throw error;
      }

      // Log l'envoi dans la base de données
      await this.fastify.prisma.emailLog.create({
        data: {
          tenantId: 'system', // TODO: Récupérer le vrai tenantId
          recipient: params.to,
          subject,
          template: 'booking-confirmation',
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            bookingReference: params.bookingReference,
            emailId: data?.id,
          },
        },
      });

      this.fastify.log.info({ emailId: data?.id }, 'Booking confirmation email sent');
    } catch (error) {
      // Log l'échec dans la base de données
      await this.fastify.prisma.emailLog.create({
        data: {
          tenantId: 'system',
          recipient: params.to,
          subject: `Confirmation de réservation ${params.bookingReference}`,
          template: 'booking-confirmation',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            bookingReference: params.bookingReference,
          },
        },
      });
      throw error;
    }
  }

  async sendPaymentFailedNotification(params: PaymentFailedParams): Promise<void> {
    try {
      const locale = params.locale || 'fr';
      const emailHtml = await render(PaymentFailedEmail({ ...params, locale }));

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Échec du paiement - Réservation ${params.bookingReference}`,
        html: emailHtml as string,
      });

      if (error) {
        this.fastify.log.error({ error }, 'Failed to send payment failed email');
        throw error;
      }

      // Log l'envoi dans la base de données
      await this.fastify.prisma.emailLog.create({
        data: {
          tenantId: 'system',
          recipient: params.to,
          subject: `Échec du paiement - Réservation ${params.bookingReference}`,
          template: 'payment-failed',
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            bookingReference: params.bookingReference,
            emailId: data?.id,
          },
        },
      });

      this.fastify.log.info({ emailId: data?.id }, 'Payment failed email sent');
    } catch (error) {
      // Log l'échec dans la base de données
      await this.fastify.prisma.emailLog.create({
        data: {
          tenantId: 'system',
          recipient: params.to,
          subject: `Échec du paiement - Réservation ${params.bookingReference}`,
          template: 'payment-failed',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            bookingReference: params.bookingReference,
          },
        },
      });
      throw error;
    }
  }

  async sendBookingCancellation(params: BookingCancellationParams): Promise<void> {
    try {
      const locale = params.locale || 'fr';
      const emailHtml = await render(BookingCancelledEmail({ ...params, locale }));

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Annulation de votre réservation ${params.bookingReference}`,
        html: emailHtml as string,
      });

      if (error) {
        this.fastify.log.error({ error }, 'Failed to send booking cancellation email');
        throw error;
      }

      // Log l'envoi dans la base de données
      await this.fastify.prisma.emailLog.create({
        data: {
          tenantId: 'system',
          recipient: params.to,
          subject: `Annulation de votre réservation ${params.bookingReference}`,
          template: 'booking-cancelled',
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            bookingReference: params.bookingReference,
            emailId: data?.id,
          },
        },
      });

      this.fastify.log.info({ emailId: data?.id }, 'Booking cancellation email sent');
    } catch (error) {
      // Log l'échec dans la base de données
      await this.fastify.prisma.emailLog.create({
        data: {
          tenantId: 'system',
          recipient: params.to,
          subject: `Annulation de votre réservation ${params.bookingReference}`,
          template: 'booking-cancelled',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            bookingReference: params.bookingReference,
          },
        },
      });
      throw error;
    }
  }

  async sendBookingNotificationToOwner(_params: OwnerNotificationParams): Promise<void> {
    // TODO: Créer le template et implémenter
    this.fastify.log.info('Owner notification not implemented yet');
  }

  async sendCheckInReminder(_params: CheckInReminderParams): Promise<void> {
    // TODO: Créer le template et implémenter
    this.fastify.log.info('Check-in reminder not implemented yet');
  }

  async sendCheckInInstructions(_params: CheckInInstructionsParams): Promise<void> {
    // TODO: Créer le template et implémenter
    this.fastify.log.info('Check-in instructions not implemented yet');
  }

  async sendReviewRequest(_params: ReviewRequestParams): Promise<void> {
    // TODO: Créer le template et implémenter
    this.fastify.log.info('Review request not implemented yet');
  }
}

// Service mock pour le développement
export class MockEmailService implements EmailService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  async sendBookingConfirmation(params: BookingConfirmationParams): Promise<void> {
    this.fastify.log.info({ params }, 'Mock: Sending booking confirmation email');
  }

  async sendPaymentFailedNotification(params: PaymentFailedParams): Promise<void> {
    this.fastify.log.info({ params }, 'Mock: Sending payment failed email');
  }

  async sendBookingCancellation(params: BookingCancellationParams): Promise<void> {
    this.fastify.log.info({ params }, 'Mock: Sending booking cancellation email');
  }

  async sendBookingNotificationToOwner(params: OwnerNotificationParams): Promise<void> {
    this.fastify.log.info({ params }, 'Mock: Sending owner notification email');
  }

  async sendCheckInReminder(params: CheckInReminderParams): Promise<void> {
    this.fastify.log.info({ params }, 'Mock: Sending check-in reminder email');
  }

  async sendCheckInInstructions(params: CheckInInstructionsParams): Promise<void> {
    this.fastify.log.info({ params }, 'Mock: Sending check-in instructions email');
  }

  async sendReviewRequest(params: ReviewRequestParams): Promise<void> {
    this.fastify.log.info({ params }, 'Mock: Sending review request email');
  }
}

// Factory pour créer le bon service selon l'environnement
export function createEmailService(fastify: FastifyInstance): EmailService {
  if (process.env.RESEND_API_KEY) {
    return new ResendEmailService(fastify);
  }
  return new MockEmailService(fastify);
}