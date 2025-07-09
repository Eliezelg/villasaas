import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';
import { createEmailService } from '../../services/email.service';

const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('EUR'),
  metadata: z.object({
    propertyId: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    guestEmail: z.string().email(),
    guestName: z.string(),
    tenantId: z.string(),
    adults: z.number().optional(),
    children: z.number().optional(),
    infants: z.number().optional(),
    pets: z.number().optional(),
    selectedOptions: z.array(z.object({
      optionId: z.string(),
      quantity: z.number()
    })).optional()
  }),
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  bookingId: z.string(),
});

const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

export async function paymentsRoutes(fastify: FastifyInstance) {
  // Route publique pour créer une intention de paiement
  fastify.post('/public/payments/create-intent', {
    schema: {
      description: 'Créer une intention de paiement Stripe',
      tags: ['public', 'payments'],
    }
  }, async (request, reply) => {
    const validation = createPaymentIntentSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { amount, currency, metadata } = validation.data;
    const tenantSubdomain = request.headers['x-tenant'] as string;
    
    if (!tenantSubdomain) {
      return reply.code(400).send({ error: 'Tenant not specified' });
    }

    try {
      // Récupérer le tenant
      const tenant = await fastify.prisma.tenant.findFirst({
        where: { subdomain: tenantSubdomain }
      });

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      // Vérifier que la propriété appartient bien au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: metadata.propertyId,
          tenantId: tenant.id,
        }
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      // SÉCURITÉ: Calculer le montant côté serveur
      const bookingService = new (await import('../bookings/booking.service')).BookingService(fastify.prisma);
      
      // Parser les dates
      const checkIn = new Date(metadata.checkIn);
      const checkOut = new Date(metadata.checkOut);
      
      // Extraire les informations des invités depuis les métadonnées
      const guests = {
        adults: metadata.adults || 2,
        children: metadata.children || 0,
        infants: metadata.infants || 0,
        pets: metadata.pets || 0
      };
      
      // Calculer le prix réel de la réservation
      const priceCalculation = await bookingService.calculateBookingPrice(
        metadata.propertyId,
        checkIn,
        checkOut,
        guests,
        metadata.selectedOptions
      );
      
      // SÉCURITÉ: Vérifier que le montant envoyé correspond au montant calculé
      const calculatedAmount = priceCalculation.total;
      const tolerance = 0.01; // Tolérance de 1 centime pour les arrondis
      
      if (Math.abs(amount - calculatedAmount) > tolerance) {
        fastify.log.error({
          receivedAmount: amount,
          calculatedAmount,
          difference: Math.abs(amount - calculatedAmount)
        }, 'Amount mismatch detected');
        
        return reply.code(400).send({ 
          error: 'Invalid amount. Price verification failed.',
          expected: calculatedAmount,
          received: amount
        });
      }

      // Créer l'intention de paiement avec le montant vérifié
      const paymentIntent = await fastify.stripe.paymentIntents.create({
        amount: Math.round(calculatedAmount * 100), // Stripe utilise les centimes
        currency: currency.toLowerCase(),
        metadata: {
          ...metadata,
          tenantId: tenant.id,
          tenantName: tenant.name,
          propertyName: property.name,
          platform: 'villa-saas',
          verifiedAmount: calculatedAmount.toString(),
          priceBreakdown: JSON.stringify({
            nights: priceCalculation.nights,
            accommodationTotal: priceCalculation.accommodationTotal,
            cleaningFee: priceCalculation.cleaningFee,
            touristTax: priceCalculation.touristTax,
            optionsTotal: priceCalculation.optionsTotal,
            discountAmount: priceCalculation.discountAmount,
            total: priceCalculation.total
          })
        },
        // Pour Stripe Connect, on configurera plus tard le connected account
        // application_fee_amount: Math.round(amount * 0.1 * 100), // 10% commission
        // transfer_data: {
        //   destination: tenant.stripeAccountId,
        // },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        verifiedAmount: calculatedAmount
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to create payment intent' 
      });
    }
  });

  // Route publique pour récupérer la clé publique Stripe
  fastify.get('/public/payments/config', {
    schema: {
      description: 'Obtenir la configuration Stripe publique',
      tags: ['public', 'payments'],
    }
  }, async (request, reply) => {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      return reply.code(500).send({ error: 'Stripe not configured' });
    }

    return {
      publishableKey,
      currency: 'EUR',
      country: 'FR',
    };
  });

  // Route sécurisée pour confirmer un paiement
  fastify.post('/payments/confirm', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Confirmer un paiement et mettre à jour la réservation',
      tags: ['payments'],
    }
  }, async (request, reply) => {
    const validation = confirmPaymentSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { paymentIntentId, bookingId } = validation.data;
    const { tenantId } = request;

    try {
      // Vérifier que la réservation existe et appartient au tenant
      const booking = await fastify.prisma.booking.findFirst({
        where: {
          id: bookingId,
          tenantId,
        }
      });

      if (!booking) {
        return reply.code(404).send({ error: 'Booking not found' });
      }

      // Récupérer l'intention de paiement depuis Stripe
      const paymentIntent = await fastify.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return reply.code(400).send({ error: 'Payment not successful' });
      }

      // Mettre à jour la réservation
      const updatedBooking = await fastify.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentIntentId,
          paidAt: new Date(),
        }
      });

      // Créer un log d'audit
      await fastify.prisma.auditLog.create({
        data: {
          tenantId,
          userId: request.userId,
          action: 'booking.payment.confirmed',
          entity: 'booking',
          entityId: bookingId,
          details: {
            paymentIntentId,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
          },
        }
      });

      return updatedBooking;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to confirm payment' 
      });
    }
  });

  // Webhook Stripe pour gérer les événements
  fastify.post('/public/stripe/webhook', {
    config: {
      // Désactiver le parsing JSON car Stripe envoie du raw body
      rawBody: true,
    },
    preValidation: async (request, reply) => {
      // Capturer le raw body pour la validation de signature
      const chunks = [];
      request.raw.on('data', (chunk) => chunks.push(chunk));
      await new Promise((resolve) => {
        request.raw.on('end', () => {
          request.rawBody = Buffer.concat(chunks).toString('utf8');
          resolve(true);
        });
      });
    },
    schema: {
      description: 'Webhook Stripe pour les événements de paiement',
      tags: ['public', 'payments'],
    }
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      fastify.log.error('STRIPE_WEBHOOK_SECRET not configured');
      return reply.code(500).send({ error: 'Webhook not configured' });
    }

    if (!sig) {
      fastify.log.error('Missing stripe-signature header');
      return reply.code(400).send({ error: 'Missing signature' });
    }

    let event: Stripe.Event;

    try {
      // Vérifier la signature du webhook avec le raw body capturé
      event = fastify.stripe.webhooks.constructEvent(
        request.rawBody as string,
        sig,
        webhookSecret
      );
    } catch (err) {
      fastify.log.error('Webhook signature verification failed:', err);
      return reply.code(400).send({ error: 'Invalid signature' });
    }

    // Traiter les événements
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          fastify.log.info(`Payment succeeded: ${paymentIntent.id}`);
          
          // Mettre à jour la réservation automatiquement
          if (paymentIntent.metadata?.tenantId) {
            const booking = await fastify.prisma.booking.findFirst({
              where: {
                stripePaymentId: paymentIntent.id,
                tenantId: paymentIntent.metadata.tenantId,
              },
              include: {
                property: {
                  include: {
                    images: true,
                  }
                },
                tenant: true,
              }
            });

            if (booking) {
              await fastify.prisma.booking.update({
                where: { id: booking.id },
                data: {
                  status: 'CONFIRMED',
                  paymentStatus: 'PAID',
                  paidAt: new Date(),
                }
              });
              
              // Envoyer l'email de confirmation
              try {
                const emailService = createEmailService(fastify);
                await emailService.sendBookingConfirmation({
                  to: booking.guestEmail,
                  bookingReference: booking.reference,
                  guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
                  propertyName: booking.property.name,
                  checkIn: booking.checkIn.toLocaleDateString('fr-FR'),
                  checkOut: booking.checkOut.toLocaleDateString('fr-FR'),
                  guests: booking.adults + booking.children,
                  totalAmount: booking.total,
                  currency: booking.currency,
                  propertyImage: booking.property.images?.[0]?.urls?.large || booking.property.images?.[0]?.url,
                  tenantName: booking.tenant.name,
                  tenantLogo: booking.tenant.logo || undefined,
                  tenantSubdomain: booking.tenant.subdomain,
                  locale: booking.guestCountry === 'GB' || booking.guestCountry === 'US' ? 'en' : 'fr'
                });
                fastify.log.info(`Confirmation email sent for booking: ${booking.reference}`);
              } catch (emailError) {
                fastify.log.error({ emailError }, 'Failed to send confirmation email from webhook');
              }
              
              fastify.log.info(`Booking confirmed for payment intent: ${paymentIntent.id}`);
            }
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          fastify.log.error(`Payment failed: ${paymentIntent.id}`);
          
          // Récupérer la réservation associée
          const booking = await fastify.prisma.booking.findFirst({
            where: {
              stripePaymentId: paymentIntent.id,
              status: 'PENDING'
            },
            include: {
              property: {
                select: {
                  name: true,
                  images: {
                    orderBy: { order: 'asc' },
                    take: 1
                  }
                }
              },
              tenant: {
                select: {
                  name: true,
                  logo: true,
                  subdomain: true
                }
              }
            }
          });

          if (booking) {
            // Envoyer l'email de notification d'échec
            try {
              const emailService = createEmailService(fastify);
              const retryUrl = `${process.env.NEXT_PUBLIC_BOOKING_URL}/${booking.tenant.subdomain}/booking/retry/${booking.id}`;
              
              await emailService.sendPaymentFailedNotification({
                to: booking.guestEmail,
                bookingReference: booking.reference,
                guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
                propertyName: booking.property.name,
                checkIn: booking.checkIn.toLocaleDateString('fr-FR'),
                checkOut: booking.checkOut.toLocaleDateString('fr-FR'),
                totalAmount: booking.total,
                currency: booking.currency,
                tenantName: booking.tenant.name,
                tenantLogo: booking.tenant.logo || undefined,
                retryUrl,
                locale: booking.guestCountry === 'GB' || booking.guestCountry === 'US' ? 'en' : 'fr'
              });

              // Marquer la réservation comme ayant un paiement échoué
              await fastify.prisma.booking.update({
                where: { id: booking.id },
                data: {
                  paymentStatus: 'FAILED',
                  metadata: {
                    ...(booking.metadata as any || {}),
                    paymentFailedAt: new Date().toISOString(),
                    paymentFailureReason: paymentIntent.last_payment_error?.message
                  }
                }
              });

              // Planifier l'annulation automatique dans 24h
              // Note: Ceci pourrait être fait avec un job queue comme BullMQ
              setTimeout(async () => {
                // Vérifier si le paiement n'a toujours pas été effectué
                const currentBooking = await fastify.prisma.booking.findUnique({
                  where: { id: booking.id }
                });

                if (currentBooking && currentBooking.paymentStatus === 'FAILED' && currentBooking.status === 'PENDING') {
                  // Annuler la réservation
                  await fastify.prisma.booking.update({
                    where: { id: booking.id },
                    data: {
                      status: 'CANCELLED',
                      metadata: {
                        ...(currentBooking.metadata as any || {}),
                        cancelledAt: new Date().toISOString(),
                        cancellationReason: 'Payment not completed within 24 hours'
                      }
                    }
                  });

                  // Envoyer l'email d'annulation
                  await emailService.sendBookingCancellation({
                    to: booking.guestEmail,
                    bookingReference: booking.reference,
                    guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
                    propertyName: booking.property.name,
                    checkIn: booking.checkIn.toLocaleDateString('fr-FR'),
                    checkOut: booking.checkOut.toLocaleDateString('fr-FR'),
                    tenantName: booking.tenant.name,
                    tenantLogo: booking.tenant.logo || undefined,
                    locale: booking.guestCountry === 'GB' || booking.guestCountry === 'US' ? 'en' : 'fr'
                  });
                }
              }, 24 * 60 * 60 * 1000); // 24 heures

            } catch (emailError) {
              fastify.log.error({ emailError }, 'Failed to send payment failed notification');
            }
          }
          
          break;
        }

        case 'charge.dispute.created': {
          const dispute = event.data.object as Stripe.Dispute;
          fastify.log.warn(`Dispute created: ${dispute.id}`);
          
          // TODO: Notifier l'administrateur du litige
          break;
        }

        default:
          fastify.log.info(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      fastify.log.error('Error processing webhook:', error);
      return reply.code(500).send({ error: 'Webhook processing failed' });
    }
  });

  // Route pour lister les paiements d'un tenant
  fastify.get('/payments', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Lister les paiements du tenant',
      tags: ['payments'],
    }
  }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
    const { tenantId } = request;

    try {
      // Récupérer les réservations payées
      const bookings = await fastify.prisma.booking.findMany({
        where: {
          tenantId,
          paymentStatus: 'PAID',
          paymentIntentId: { not: null },
        },
        include: {
          property: {
            select: {
              name: true,
            }
          }
        },
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await fastify.prisma.booking.count({
        where: {
          tenantId,
          paymentStatus: 'PAID',
          paymentIntentId: { not: null },
        }
      });

      return {
        payments: bookings.map(booking => ({
          id: booking.id,
          reference: booking.reference,
          propertyName: booking.property.name,
          guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
          amount: booking.totalAmount,
          currency: booking.currency,
          paidAt: booking.paidAt,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          paymentIntentId: booking.paymentIntentId,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch payments' });
    }
  });
}