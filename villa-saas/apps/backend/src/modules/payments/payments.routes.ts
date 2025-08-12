import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';
import { getTenantId } from '@villa-saas/utils';
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


export async function paymentsRoutes(fastify: FastifyInstance) {
  // Route pour créer un lien d'onboarding Stripe Connect
  fastify.post('/stripe/connect/onboarding', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Créer un lien d\'onboarding Stripe Connect pour le tenant',
      tags: ['payments', 'stripe'],
    }
  }, async (request, reply) => {
    const { tenantId } = request;
    const userId = request.user?.userId;
    
    try {
      // Récupérer le tenant
      const tenant = await fastify.prisma.tenant.findUnique({
        where: { id: tenantId! }
      });

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      let accountId = tenant.stripeAccountId;

      // Si le tenant n'a pas encore de compte Stripe, en créer un
      if (!accountId) {
        const account = await fastify.stripe.accounts.create({
          type: 'express',
          country: 'FR',
          email: tenant.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'company',
          company: {
            name: tenant.companyName || tenant.name,
          },
          metadata: {
            tenantId: tenant.id,
            platform: 'villa-saas',
          },
        });

        accountId = account.id;

        // Sauvegarder l'ID du compte Stripe
        await fastify.prisma.tenant.update({
          where: { id: tenantId! },
          data: { 
            stripeAccountId: accountId,
            stripeAccountStatus: 'pending'
          }
        });
      }

      // Créer un lien d'onboarding
      const accountLink = await fastify.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/fr/admin/dashboard/payment-configuration?refresh=true`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/fr/admin/dashboard/payment-configuration?success=true`,
        type: 'account_onboarding',
      });

      // Créer un log d'audit
      await fastify.prisma.auditLog.create({
        data: {
          tenantId: tenantId!,
          userId: userId || '',
          action: 'stripe.connect.onboarding.started',
          entity: 'tenant',
          entityId: tenantId!,
          details: {
            stripeAccountId: accountId,
          },
        }
      });

      return { url: accountLink.url };
    } catch (error) {
      fastify.log.error('Stripe Connect onboarding error:', error);
      
      // Vérifier si c'est une erreur de configuration Stripe
      if (error instanceof Error && error.message.includes('stripe')) {
        return reply.code(503).send({ 
          error: 'Stripe n\'est pas configuré. Veuillez ajouter les clés API Stripe dans les variables d\'environnement.',
          message: 'Configuration Stripe manquante'
        });
      }
      
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to create Stripe onboarding link',
        message: 'Erreur lors de la création du lien Stripe Connect'
      });
    }
  });

  // Route pour vérifier le statut Stripe Connect
  fastify.get('/stripe/connect/status', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Vérifier le statut du compte Stripe Connect',
      tags: ['payments', 'stripe'],
    }
  }, async (request, reply) => {
    const { tenantId } = request;
    
    try {
      const tenant = await fastify.prisma.tenant.findUnique({
        where: { id: tenantId! },
        select: {
          stripeAccountId: true,
          stripeAccountStatus: true,
          stripeDetailsSubmitted: true,
          stripeChargesEnabled: true,
          stripePayoutsEnabled: true,
        }
      });

      if (!tenant || !tenant.stripeAccountId) {
        return {
          connected: false,
          status: 'not_connected'
        };
      }

      // Récupérer les détails du compte depuis Stripe
      const account = await fastify.stripe.accounts.retrieve(tenant.stripeAccountId);

      // Mettre à jour le statut si nécessaire
      const needsUpdate = 
        tenant.stripeDetailsSubmitted !== account.details_submitted ||
        tenant.stripeChargesEnabled !== account.charges_enabled ||
        tenant.stripePayoutsEnabled !== account.payouts_enabled;

      if (needsUpdate) {
        await fastify.prisma.tenant.update({
          where: { id: tenantId! },
          data: {
            stripeDetailsSubmitted: account.details_submitted,
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeAccountStatus: account.charges_enabled ? 'active' : 'pending',
          }
        });
      }

      return {
        connected: true,
        status: account.charges_enabled ? 'active' : 'pending',
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to check Stripe status' 
      });
    }
  });

  // Route pour initier OAuth Connect (compte Stripe existant)
  fastify.get('/stripe/connect/oauth', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Initier la connexion OAuth avec un compte Stripe existant',
      tags: ['payments', 'stripe'],
    }
  }, async (request, reply) => {
    const { tenantId } = request;
    
    const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    if (!clientId) {
      return reply.code(503).send({ 
        error: 'OAuth Connect n\'est pas configuré. Veuillez ajouter STRIPE_CONNECT_CLIENT_ID dans les variables d\'environnement.',
        message: 'Configuration OAuth manquante'
      });
    }
    
    // Créer l'URL OAuth
    const state = Buffer.from(JSON.stringify({ 
      tenantId,
      timestamp: Date.now()
    })).toString('base64');
    
    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/stripe/connect/callback`;
    
    const oauthUrl = `https://connect.stripe.com/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `scope=read_write&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;
    
    return { url: oauthUrl };
  });

  // Route callback OAuth (appelée par Stripe après autorisation)
  fastify.get('/stripe/connect/oauth/callback', async (request, reply) => {
    const { code, state, error: stripeError } = request.query as { 
      code?: string; 
      state?: string;
      error?: string;
    };
    
    // Si l'utilisateur a refusé l'autorisation
    if (stripeError) {
      fastify.log.warn('Stripe OAuth denied:', stripeError);
      return reply.redirect(`${process.env.FRONTEND_URL}/fr/admin/dashboard/payment-configuration?error=denied`);
    }
    
    if (!code || !state) {
      return reply.redirect(`${process.env.FRONTEND_URL}/fr/admin/dashboard/payment-configuration?error=invalid_request`);
    }
    
    try {
      // Décoder le state pour récupérer le tenantId
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const { tenantId } = stateData;
      
      if (!tenantId) {
        throw new Error('Invalid state: missing tenantId');
      }
      
      // Échanger le code contre les credentials
      const response = await fastify.stripe.oauth.token({
        grant_type: 'authorization_code',
        code,
      });
      
      // Récupérer les détails du compte
      if (!response.stripe_user_id) {
        throw new Error('No Stripe account ID returned');
      }
      const account = await fastify.stripe.accounts.retrieve(response.stripe_user_id);
      
      // Sauvegarder l'account ID
      await fastify.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          stripeAccountId: response.stripe_user_id,
          stripeAccountStatus: account.charges_enabled ? 'active' : 'pending',
          stripeDetailsSubmitted: account.details_submitted,
          stripeChargesEnabled: account.charges_enabled,
          stripePayoutsEnabled: account.payouts_enabled,
        }
      });
      
      // Créer un log d'audit
      await fastify.prisma.auditLog.create({
        data: {
          tenantId,
          userId: '', // On n'a pas l'userId dans le callback
          action: 'stripe.connect.oauth.connected',
          entity: 'tenant',
          entityId: tenantId,
          details: {
            stripeAccountId: response.stripe_user_id,
            accountType: 'oauth',
          },
        }
      });
      
      return reply.redirect(`${process.env.FRONTEND_URL}/fr/admin/dashboard/payment-configuration?success=true&method=oauth`);
    } catch (error) {
      fastify.log.error('OAuth callback error:', error);
      return reply.redirect(`${process.env.FRONTEND_URL}/fr/admin/dashboard/payment-configuration?error=failed`);
    }
  });

  // Route pour récupérer les paiements d'une réservation spécifique
  fastify.get('/bookings/:bookingId/payments', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Récupérer les paiements d\'une réservation',
      tags: ['bookings', 'payments'],
    }
  }, async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string };
    const { tenantId } = request;

    try {
      // Vérifier que la réservation appartient au tenant
      const booking = await fastify.prisma.booking.findFirst({
        where: {
          id: bookingId,
          tenantId,
        },
        include: {
          property: {
            select: {
              name: true,
            }
          }
        }
      });

      if (!booking) {
        return reply.code(404).send({ error: 'Booking not found' });
      }

      // Si la réservation a un payment intent, récupérer les détails depuis Stripe
      let paymentDetails: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        created: Date;
        paymentMethod: string | null;
      } | null = null;
      if (booking.stripePaymentId) {
        try {
          const paymentIntent = await fastify.stripe.paymentIntents.retrieve(booking.stripePaymentId);
          paymentDetails = {
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            created: new Date(paymentIntent.created * 1000),
            paymentMethod: typeof paymentIntent.payment_method === 'string' 
              ? paymentIntent.payment_method 
              : paymentIntent.payment_method?.id || null,
          };
        } catch (stripeError) {
          fastify.log.error(stripeError, 'Failed to retrieve payment intent from Stripe');
        }
      }

      return {
        booking: {
          id: booking.id,
          reference: booking.reference,
          total: booking.total,
          currency: booking.currency,
          paymentStatus: booking.paymentStatus,
          paidAt: booking.paymentStatus === 'PAID' ? booking.updatedAt : null,
        },
        payment: paymentDetails,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch booking payments' });
    }
  });
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
          propertyId: metadata.propertyId,
          checkIn: metadata.checkIn,
          checkOut: metadata.checkOut,
          guestEmail: metadata.guestEmail,
          guestName: metadata.guestName,
          adults: metadata.adults?.toString() || '0',
          children: metadata.children?.toString() || '0',
          infants: metadata.infants?.toString() || '0',
          pets: metadata.pets?.toString() || '0',
          selectedOptions: metadata.selectedOptions ? JSON.stringify(metadata.selectedOptions) : '',
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
  }, async (_request, reply) => {
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
          stripePaymentId: paymentIntentId,
        }
      });

      // Créer un log d'audit
      await fastify.prisma.auditLog.create({
        data: {
          tenantId: tenantId!,
          userId: request.user?.userId || '',
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
      // Vérifier que le rawBody existe
      if (!request.rawBody) {
        fastify.log.error('Missing raw body in request');
        return reply.code(400).send({ error: 'Missing request body' });
      }

      // Vérifier la signature du webhook avec le raw body capturé
      event = fastify.stripe.webhooks.constructEvent(
        request.rawBody,
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
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    subdomain: true,
                    publicSite: {
                      select: {
                        logo: true
                      }
                    }
                  }
                },
              }
            });

            if (booking) {
              await fastify.prisma.booking.update({
                where: { id: booking.id },
                data: {
                  status: 'CONFIRMED',
                  paymentStatus: 'PAID',
                }
              });
              
              // Envoyer l'email de confirmation de manière asynchrone
              // On n'attend pas la fin de l'envoi pour répondre à Stripe
              setImmediate(async () => {
                try {
                  const emailService = createEmailService(fastify);
                  await emailService.sendBookingConfirmation({
                    to: booking.guestEmail,
                    bookingReference: booking.reference,
                    guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
                    propertyName: booking.property.name,
                    checkIn: booking.checkIn.toISOString(),
                    checkOut: booking.checkOut.toISOString(),
                    guests: booking.adults + booking.children,
                    totalAmount: booking.total,
                    currency: booking.currency,
                    propertyImage: (booking.property.images?.[0]?.urls as any)?.large || booking.property.images?.[0]?.url,
                    tenantName: booking.tenant.name,
                    tenantLogo: booking.tenant.publicSite?.logo ?? undefined,
                    tenantSubdomain: booking.tenant.subdomain ?? undefined,
                    locale: booking.guestCountry === 'GB' || booking.guestCountry === 'US' ? 'en' : 'fr'
                  });
                  fastify.log.info(`Confirmation email sent for booking: ${booking.reference}`);
                } catch (emailError) {
                  // Log l'erreur mais ne pas faire échouer le webhook
                  fastify.log.error({ emailError }, 'Failed to send confirmation email from webhook');
                }
              });
              
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
                  id: true,
                  name: true,
                  subdomain: true,
                  publicSite: {
                    select: {
                      logo: true
                    }
                  }
                }
              }
            }
          });

          if (booking) {
            // Envoyer l'email de notification d'échec de manière asynchrone
            setImmediate(async () => {
              try {
                const emailService = createEmailService(fastify);
                const retryUrl = `${process.env.NEXT_PUBLIC_BOOKING_URL}/${booking.tenant.subdomain}/booking/retry/${booking.id}`;
                
                await emailService.sendPaymentFailedNotification({
                to: booking.guestEmail,
                bookingReference: booking.reference,
                guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
                propertyName: booking.property.name,
                checkIn: booking.checkIn.toISOString(),
                checkOut: booking.checkOut.toISOString(),
                totalAmount: booking.total,
                currency: booking.currency,
                tenantName: booking.tenant.name,
                tenantLogo: booking.tenant.publicSite?.logo || undefined,
                retryUrl,
                locale: booking.guestCountry === 'GB' || booking.guestCountry === 'US' ? 'en' : 'fr'
              });

              // Marquer la réservation comme ayant un paiement échoué
              await fastify.prisma.booking.update({
                where: { id: booking.id },
                data: {
                  paymentStatus: 'FAILED',
                  internalNotes: JSON.stringify({
                    paymentFailedAt: new Date().toISOString(),
                    paymentFailureReason: paymentIntent.last_payment_error?.message,
                    originalNotes: booking.internalNotes
                  })
                }
              });

              // Planifier l'annulation automatique dans 24h
              // Note: Ceci devrait être fait avec un job queue comme BullMQ en production
              setTimeout(async () => {
                try {
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
                        internalNotes: JSON.stringify({
                          cancelledAt: new Date().toISOString(),
                          cancellationReason: 'Payment not completed within 24 hours',
                          originalNotes: currentBooking.internalNotes
                        })
                      }
                    });

                    // Envoyer l'email d'annulation
                    const emailServiceForCancellation = createEmailService(fastify);
                    await emailServiceForCancellation.sendBookingCancellation({
                      to: booking.guestEmail,
                      bookingReference: booking.reference,
                      guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
                      propertyName: booking.property.name,
                      checkIn: booking.checkIn.toLocaleDateString('fr-FR'),
                      checkOut: booking.checkOut.toLocaleDateString('fr-FR'),
                      tenantName: booking.tenant.name,
                      tenantLogo: booking.tenant.publicSite?.logo ?? undefined,
                      locale: booking.guestCountry === 'GB' || booking.guestCountry === 'US' ? 'en' : 'fr'
                    });
                  }
                } catch (error) {
                  fastify.log.error({ error }, 'Failed to process delayed booking cancellation');
                }
              }, 24 * 60 * 60 * 1000); // 24 heures

              } catch (emailError) {
                fastify.log.error({ emailError }, 'Failed to send payment failed notification');
              }
            });
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

      // Toujours retourner une réponse de succès à Stripe
      return reply.code(200).send({ received: true });
    } catch (error) {
      fastify.log.error('Error processing webhook:', error);
      // Même en cas d'erreur, on répond avec succès à Stripe pour éviter les retries
      return reply.code(200).send({ received: true, error: 'Internal processing error' });
    }
  });

  // Route pour créer une intention de paiement (version authentifiée)
  fastify.post('/payments/create-intent', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Créer une intention de paiement Stripe (version authentifiée)',
      tags: ['payments'],
    }
  }, async (request, reply) => {
    const validation = createPaymentIntentSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { amount, currency, metadata } = validation.data;
    const { tenantId } = request;

    try {
      // Vérifier que la propriété appartient bien au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: metadata.propertyId,
          tenantId,
        }
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      // Créer l'intention de paiement
      const paymentIntent = await fastify.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe utilise les centimes
        currency: currency.toLowerCase(),
        metadata: {
          propertyId: metadata.propertyId,
          checkIn: metadata.checkIn,
          checkOut: metadata.checkOut,
          guestEmail: metadata.guestEmail,
          guestName: metadata.guestName,
          adults: metadata.adults?.toString() || '0',
          children: metadata.children?.toString() || '0',
          infants: metadata.infants?.toString() || '0',
          pets: metadata.pets?.toString() || '0',
          selectedOptions: metadata.selectedOptions ? JSON.stringify(metadata.selectedOptions) : '',
          tenantId: tenantId || '',
          propertyName: property.name,
          platform: 'villa-saas',
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to create payment intent' 
      });
    }
  });

  // Route pour lister les transactions (alias de payments)
  fastify.get('/payments/transactions', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Lister les transactions du tenant',
      tags: ['payments'],
    }
  }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
    const tenantId = getTenantId(request);

    try {
      const bookings = await fastify.prisma.booking.findMany({
        where: {
          tenantId,
          paymentStatus: { in: ['PAID', 'FAILED', 'PENDING'] },
          stripePaymentId: { not: null },
        },
        include: {
          property: {
            select: {
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await fastify.prisma.booking.count({
        where: {
          tenantId,
          paymentStatus: { in: ['PAID', 'FAILED', 'PENDING'] },
          stripePaymentId: { not: null },
        }
      });

      return {
        transactions: bookings.map(booking => ({
          id: booking.id,
          reference: booking.reference,
          propertyName: booking.property.name,
          guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
          amount: booking.total,
          currency: booking.currency,
          status: booking.paymentStatus,
          paidAt: booking.paymentStatus === 'PAID' ? booking.updatedAt : null,
          createdAt: booking.createdAt,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          paymentIntentId: booking.stripePaymentId,
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
      return reply.code(500).send({ error: 'Failed to fetch transactions' });
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
    const tenantId = getTenantId(request);

    try {
      // Récupérer les réservations payées
      const bookings = await fastify.prisma.booking.findMany({
        where: {
          tenantId,
          paymentStatus: 'PAID',
          stripePaymentId: { not: null },
        },
        include: {
          property: {
            select: {
              name: true,
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await fastify.prisma.booking.count({
        where: {
          tenantId,
          paymentStatus: 'PAID',
          stripePaymentId: { not: null },
        }
      });

      return {
        payments: bookings.map(booking => ({
          id: booking.id,
          reference: booking.reference,
          propertyName: booking.property.name,
          guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
          amount: booking.total,
          currency: booking.currency,
          paidAt: booking.paymentStatus === 'PAID' ? booking.updatedAt : null,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          paymentIntentId: booking.stripePaymentId,
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