"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockEmailService = exports.ResendEmailService = void 0;
exports.createEmailService = createEmailService;
const components_1 = require("@react-email/components");
const booking_confirmation_1 = __importDefault(require("../emails/templates/booking-confirmation"));
const payment_failed_1 = __importDefault(require("../emails/templates/payment-failed"));
const booking_cancelled_1 = __importDefault(require("../emails/templates/booking-cancelled"));
const i18n_email_service_1 = require("./i18n-email.service");
class ResendEmailService {
    resend;
    fromEmail;
    fastify;
    constructor(fastify) {
        this.fastify = fastify;
        this.resend = fastify.resend;
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@villa-saas.com';
    }
    async sendBookingConfirmation(params) {
        try {
            const locale = params.locale || 'fr';
            const i18n = new i18n_email_service_1.I18nEmailService(locale);
            // Préparer les paramètres du template avec l'email du client
            const templateParams = {
                ...params,
                locale,
                guestEmail: params.to, // Ajouter l'email pour la génération du lien
            };
            const emailHtml = (0, components_1.render)((0, booking_confirmation_1.default)(templateParams));
            const subject = i18n.t('emails.bookingConfirmation.subject', { reference: params.bookingReference });
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: params.to,
                subject,
                html: emailHtml,
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
        }
        catch (error) {
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
    async sendPaymentFailedNotification(params) {
        try {
            const locale = params.locale || 'fr';
            const emailHtml = (0, components_1.render)((0, payment_failed_1.default)({ ...params, locale }));
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: params.to,
                subject: `Échec du paiement - Réservation ${params.bookingReference}`,
                html: emailHtml,
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
        }
        catch (error) {
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
    async sendBookingCancellation(params) {
        try {
            const locale = params.locale || 'fr';
            const emailHtml = (0, components_1.render)((0, booking_cancelled_1.default)({ ...params, locale }));
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: params.to,
                subject: `Annulation de votre réservation ${params.bookingReference}`,
                html: emailHtml,
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
        }
        catch (error) {
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
    async sendBookingNotificationToOwner(params) {
        // TODO: Créer le template et implémenter
        this.fastify.log.info('Owner notification not implemented yet');
    }
    async sendCheckInReminder(params) {
        // TODO: Créer le template et implémenter
        this.fastify.log.info('Check-in reminder not implemented yet');
    }
    async sendCheckInInstructions(params) {
        // TODO: Créer le template et implémenter
        this.fastify.log.info('Check-in instructions not implemented yet');
    }
    async sendReviewRequest(params) {
        // TODO: Créer le template et implémenter
        this.fastify.log.info('Review request not implemented yet');
    }
}
exports.ResendEmailService = ResendEmailService;
// Service mock pour le développement
class MockEmailService {
    fastify;
    constructor(fastify) {
        this.fastify = fastify;
    }
    async sendBookingConfirmation(params) {
        this.fastify.log.info({ params }, 'Mock: Sending booking confirmation email');
    }
    async sendPaymentFailedNotification(params) {
        this.fastify.log.info({ params }, 'Mock: Sending payment failed email');
    }
    async sendBookingCancellation(params) {
        this.fastify.log.info({ params }, 'Mock: Sending booking cancellation email');
    }
    async sendBookingNotificationToOwner(params) {
        this.fastify.log.info({ params }, 'Mock: Sending owner notification email');
    }
    async sendCheckInReminder(params) {
        this.fastify.log.info({ params }, 'Mock: Sending check-in reminder email');
    }
    async sendCheckInInstructions(params) {
        this.fastify.log.info({ params }, 'Mock: Sending check-in instructions email');
    }
    async sendReviewRequest(params) {
        this.fastify.log.info({ params }, 'Mock: Sending review request email');
    }
}
exports.MockEmailService = MockEmailService;
// Factory pour créer le bon service selon l'environnement
function createEmailService(fastify) {
    if (process.env.RESEND_API_KEY) {
        return new ResendEmailService(fastify);
    }
    return new MockEmailService(fastify);
}
//# sourceMappingURL=email.service.js.map