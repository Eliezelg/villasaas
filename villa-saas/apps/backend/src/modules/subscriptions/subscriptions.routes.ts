import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';
import { SUBSCRIPTION_PLANS } from '../../config/stripe-prices';

const createCheckoutSchema = z.object({
  plan: z.enum(['starter', 'standard', 'enterprise']),
  priceId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});


const createSignupCheckoutSchema = z.object({
  plan: z.enum(['starter', 'standard', 'enterprise']),
  email: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function subscriptionsRoutes(fastify: FastifyInstance) {
  // Créer une session Stripe Checkout pour l'abonnement
  fastify.post('/subscriptions/create-checkout', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Créer une session Stripe Checkout pour un abonnement',
      tags: ['subscriptions', 'stripe'],
    }
  }, async (request, reply) => {
    const validation = createCheckoutSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { plan, priceId, successUrl, cancelUrl } = validation.data;
    const { tenantId, user } = request;

    try {
      // Récupérer le tenant
      const tenant = await fastify.prisma.tenant.findUnique({
        where: { id: tenantId! }
      });

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      // Créer ou récupérer le customer Stripe
      let customerId = tenant.stripeCustomerId;
      
      if (!customerId) {
        // Récupérer l'utilisateur complet
        const fullUser = await fastify.prisma.user.findUnique({
          where: { id: user?.userId || '' }
        });
        
        const customer = await fastify.stripe.customers.create({
          email: user?.email,
          name: fullUser ? `${fullUser.firstName} ${fullUser.lastName}` : 'Customer',
          metadata: {
            tenantId: tenantId!,
            userId: user?.userId || '',
          },
        });
        
        customerId = customer.id;
        
        // Sauvegarder le customer ID
        await fastify.prisma.tenant.update({
          where: { id: tenantId! },
          data: { stripeCustomerId: customerId }
        });
      }

      // Vérifier que le plan existe et utiliser le bon priceId
      const selectedPlan = SUBSCRIPTION_PLANS[plan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];
      if (!selectedPlan || !selectedPlan.priceId) {
        return reply.code(400).send({ error: 'Invalid plan selected' });
      }

      // Créer la session Checkout
      const session = await fastify.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: selectedPlan.priceId,
          quantity: 1,
        }],
        subscription_data: {
          metadata: {
            tenantId: tenantId!,
            plan: plan,
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: 'fr',
      });

      // Créer un log d'audit
      await fastify.prisma.auditLog.create({
        data: {
          tenantId: tenantId!,
          userId: user?.userId || '',
          action: 'subscription.checkout.created',
          entity: 'subscription',
          entityId: session.id,
          details: {
            plan,
            priceId,
          },
        }
      });

      return { url: session.url };
    } catch (error) {
      fastify.log.error('Stripe checkout error:', error);
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to create checkout session' 
      });
    }
  });

  // Créer une session Stripe Checkout pour le signup (sans auth)
  fastify.post('/subscriptions/signup-checkout', {
    schema: {
      description: 'Créer une session Stripe Checkout pour un nouvel utilisateur',
      tags: ['subscriptions', 'stripe', 'public'],
    }
  }, async (request, reply) => {
    const validation = createSignupCheckoutSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { plan, email, successUrl, cancelUrl } = validation.data;

    try {
      // Vérifier que le plan existe
      const selectedPlan = SUBSCRIPTION_PLANS[plan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];
      if (!selectedPlan || !selectedPlan.priceId) {
        return reply.code(400).send({ error: 'Invalid plan selected' });
      }

      fastify.log.info('Creating Stripe checkout session for signup', {
        plan,
        email,
        priceId: selectedPlan.priceId,
      });

      // Créer la session Checkout en mode setup pour collecter la carte
      // Le paiement sera effectué après la création du compte
      const session = await fastify.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: selectedPlan.priceId,
          quantity: 1,
        }],
        customer_email: email,
        subscription_data: {
          metadata: {
            plan: plan,
            signup: 'true',
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: 'fr',
        metadata: {
          plan: plan,
          email: email,
          signup: 'true',
        },
      });

      return { url: session.url, sessionId: session.id };
    } catch (error: any) {
      fastify.log.error('Stripe signup checkout error:', {
        message: error?.message,
        type: error?.type,
        code: error?.code,
        statusCode: error?.statusCode,
        raw: error?.raw,
      });
      
      // Si c'est une erreur Stripe, on peut avoir plus de détails
      if (error?.type === 'StripeInvalidRequestError') {
        return reply.code(400).send({ 
          error: error.message,
          param: error.param,
          code: error.code
        });
      }
      
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
        details: error instanceof Error ? error.stack : String(error)
      });
    }
  });

  // Récupérer l'abonnement actuel
  fastify.get('/subscriptions/current', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Récupérer l\'abonnement actuel du tenant',
      tags: ['subscriptions'],
    }
  }, async (request, reply) => {
    const { tenantId } = request;

    try {
      const tenant = await fastify.prisma.tenant.findUnique({
        where: { id: tenantId! },
        select: {
          stripeSubscriptionId: true,
          stripeCustomerId: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
        }
      });

      if (!tenant || !tenant.stripeSubscriptionId) {
        return {
          hasSubscription: false,
          plan: null,
          status: null,
        };
      }

      // Récupérer les détails depuis Stripe
      const subscription = await fastify.stripe.subscriptions.retrieve(
        tenant.stripeSubscriptionId
      );

      return {
        hasSubscription: true,
        plan: tenant.subscriptionPlan,
        status: subscription.status,
        current_period_end: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to retrieve subscription' 
      });
    }
  });

  // Changer de plan
  fastify.post('/subscriptions/change-plan', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Changer de plan d\'abonnement',
      tags: ['subscriptions'],
    }
  }, async (request, reply) => {
    const validation = z.object({
      newPlan: z.enum(['starter', 'standard']),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }).safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { newPlan, successUrl, cancelUrl } = validation.data;
    const { tenantId, user } = request;

    try {
      const tenant = await fastify.prisma.tenant.findUnique({
        where: { id: tenantId! },
        select: {
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          subscriptionPlan: true,
          email: true,
        }
      });

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      // Si le plan est le même, pas besoin de changer
      if (tenant.subscriptionPlan === newPlan) {
        return reply.code(400).send({ error: 'Already on this plan' });
      }

      // Récupérer le nouveau plan
      const selectedPlan = SUBSCRIPTION_PLANS[newPlan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];
      if (!selectedPlan || !selectedPlan.priceId) {
        return reply.code(400).send({ error: 'Invalid plan selected' });
      }

      let sessionUrl: string;

      if (tenant.stripeSubscriptionId) {
        // Si l'utilisateur a déjà un abonnement actif, modifier directement l'abonnement
        const subscription = await fastify.stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
        
        // Récupérer le premier item de l'abonnement
        const subscriptionItem = subscription.items.data[0];
        if (!subscriptionItem) {
          return reply.code(400).send({ error: 'No subscription item found' });
        }
        
        try {
          // Mettre à jour l'abonnement avec le nouveau prix
          await fastify.stripe.subscriptions.update(tenant.stripeSubscriptionId, {
            items: [{
              id: subscriptionItem.id,
              price: selectedPlan.priceId,
            }],
            proration_behavior: 'create_prorations', // Créer une facture prorata
            metadata: {
              plan: newPlan,
              tenantId: tenantId!,
            }
          });

          // Mettre à jour le tenant dans la base de données
          await fastify.prisma.tenant.update({
            where: { id: tenantId! },
            data: {
              subscriptionPlan: newPlan,
            }
          });

          // Pas besoin de redirection Stripe, le changement est immédiat
          return { 
            success: true, 
            message: 'Plan changed successfully',
            plan: newPlan 
          };
        } catch (stripeError: any) {
          // Si le client n'a pas de méthode de paiement valide, rediriger vers Checkout
          if (stripeError.code === 'missing_payment_method') {
            const session = await fastify.stripe.checkout.sessions.create({
              customer: tenant.stripeCustomerId!,
              payment_method_types: ['card'],
              mode: 'setup',
              setup_intent_data: {
                metadata: {
                  subscription_id: tenant.stripeSubscriptionId,
                  new_plan: newPlan,
                  tenantId: tenantId!,
                  action: 'change_plan'
                }
              },
              success_url: `${successUrl}?action=change_plan&plan=${newPlan}`,
              cancel_url: cancelUrl,
              locale: 'fr',
            });

            sessionUrl = session.url!;
          } else {
            throw stripeError;
          }
        }
      } else {
        // Si pas d'abonnement actif, créer un nouvel abonnement
        const session = await fastify.stripe.checkout.sessions.create({
          customer: tenant.stripeCustomerId || undefined,
          customer_email: !tenant.stripeCustomerId ? tenant.email : undefined,
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [{
            price: selectedPlan.priceId,
            quantity: 1,
          }],
          subscription_data: {
            metadata: {
              tenantId: tenantId!,
              plan: newPlan,
            },
          },
          success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&action=new_subscription&plan=${newPlan}`,
          cancel_url: cancelUrl,
          locale: 'fr',
        });

        sessionUrl = session.url!;
      }

      // Créer un log d'audit
      await fastify.prisma.auditLog.create({
        data: {
          tenantId: tenantId!,
          userId: user?.userId || '',
          action: 'subscription.change_plan.initiated',
          entity: 'subscription',
          entityId: tenant.stripeSubscriptionId || 'new',
          details: {
            currentPlan: tenant.subscriptionPlan,
            newPlan,
          },
        }
      });

      return { url: sessionUrl };
    } catch (error) {
      fastify.log.error('Change plan error:', error);
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to change plan' 
      });
    }
  });

  // Annuler l'abonnement
  fastify.post('/subscriptions/cancel', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Annuler l\'abonnement actuel',
      tags: ['subscriptions'],
    }
  }, async (request, reply) => {
    const { tenantId, user } = request;

    try {
      const tenant = await fastify.prisma.tenant.findUnique({
        where: { id: tenantId! },
        select: {
          stripeSubscriptionId: true,
        }
      });

      if (!tenant || !tenant.stripeSubscriptionId) {
        return reply.code(404).send({ error: 'No active subscription found' });
      }

      // Annuler à la fin de la période
      const subscription = await fastify.stripe.subscriptions.update(
        tenant.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      // Créer un log d'audit
      await fastify.prisma.auditLog.create({
        data: {
          tenantId: tenantId!,
          userId: user?.userId || '',
          action: 'subscription.cancelled',
          entity: 'subscription',
          entityId: tenant.stripeSubscriptionId,
          details: {
            cancelAtPeriodEnd: true,
            current_period_end: new Date((subscription as any).current_period_end * 1000),
          },
        }
      });

      return { 
        success: true,
        cancelAtPeriodEnd: true,
        current_period_end: new Date((subscription as any).current_period_end * 1000),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to cancel subscription' 
      });
    }
  });

  // Réactiver l'abonnement (annuler l'annulation)
  fastify.post('/subscriptions/reactivate', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Réactiver un abonnement annulé',
      tags: ['subscriptions'],
    }
  }, async (request, reply) => {
    const { tenantId, user } = request;

    try {
      const tenant = await fastify.prisma.tenant.findUnique({
        where: { id: tenantId! },
        select: {
          stripeSubscriptionId: true,
        }
      });

      if (!tenant || !tenant.stripeSubscriptionId) {
        return reply.code(404).send({ error: 'No subscription found' });
      }

      // Réactiver l'abonnement
      const subscription = await fastify.stripe.subscriptions.update(
        tenant.stripeSubscriptionId,
        { cancel_at_period_end: false }
      );

      // Créer un log d'audit
      await fastify.prisma.auditLog.create({
        data: {
          tenantId: tenantId!,
          userId: user?.userId || '',
          action: 'subscription.reactivated',
          entity: 'subscription',
          entityId: tenant.stripeSubscriptionId,
        }
      });

      return { 
        success: true,
        status: subscription.status,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to reactivate subscription' 
      });
    }
  });

  // Webhook Stripe pour gérer les événements d'abonnement
  fastify.post('/public/stripe/subscription-webhook', {
    config: {
      rawBody: true,
    },
    schema: {
      description: 'Webhook Stripe pour les événements d\'abonnement',
      tags: ['subscriptions', 'webhooks'],
    }
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

    if (!webhookSecret) {
      fastify.log.error('Missing STRIPE_SUBSCRIPTION_WEBHOOK_SECRET');
      return reply.code(500).send({ error: 'Webhook secret not configured' });
    }

    let event: Stripe.Event;

    try {
      event = fastify.stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        webhookSecret
      );
    } catch (err) {
      fastify.log.error('Webhook signature verification failed:', err);
      return reply.code(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Gérer les différents types d'événements
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          if (session.mode === 'subscription') {
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;
            
            // Récupérer les détails de l'abonnement
            const subscription = await fastify.stripe.subscriptions.retrieve(subscriptionId);
            
            // Mettre à jour le tenant
            const customer = await fastify.stripe.customers.retrieve(customerId);
            const tenantId = (customer as any).metadata?.tenantId;
            
            if (tenantId) {
              await fastify.prisma.tenant.update({
                where: { id: tenantId },
                data: {
                  stripeSubscriptionId: subscriptionId,
                  subscriptionPlan: subscription.metadata.plan || 'starter',
                  subscriptionStatus: subscription.status,
                  subscriptionEndDate: new Date((subscription as any).current_period_end * 1000),
                }
              });
            }
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Récupérer le tenant depuis le customer
          const customer = await fastify.stripe.customers.retrieve(customerId);
          const tenantId = (customer as any).metadata?.tenantId;
          
          if (tenantId) {
            await fastify.prisma.tenant.update({
              where: { id: tenantId },
              data: {
                subscriptionStatus: subscription.status,
                subscriptionEndDate: new Date((subscription as any).current_period_end * 1000),
              }
            });
          }
          break;
        }

        case 'setup_intent.succeeded': {
          const setupIntent = event.data.object as Stripe.SetupIntent;
          const metadata = setupIntent.metadata;
          
          if (metadata && metadata.action === 'change_plan' && metadata.subscription_id && metadata.new_plan) {
            // Récupérer l'abonnement et le mettre à jour
            const subscription = await fastify.stripe.subscriptions.retrieve(metadata.subscription_id);
            const subscriptionItem = subscription.items.data[0];
            if (!subscriptionItem) {
              throw new Error('No subscription item found');
            }
            
            // Récupérer le nouveau plan
            const selectedPlan = SUBSCRIPTION_PLANS[metadata.new_plan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];
            if (selectedPlan && selectedPlan.priceId) {
              // Mettre à jour l'abonnement avec le nouveau prix
              await fastify.stripe.subscriptions.update(metadata.subscription_id, {
                items: [{
                  id: subscriptionItem.id,
                  price: selectedPlan.priceId,
                }],
                proration_behavior: 'create_prorations',
                metadata: {
                  plan: metadata.new_plan,
                  tenantId: metadata.tenantId || '',
                }
              });

              // Mettre à jour le tenant dans la base de données
              if (metadata.tenantId) {
                await fastify.prisma.tenant.update({
                  where: { id: metadata.tenantId },
                  data: {
                    subscriptionPlan: metadata.new_plan,
                  }
                });
              }
            }
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Récupérer le tenant depuis le customer
          const customer = await fastify.stripe.customers.retrieve(customerId);
          const tenantId = (customer as any).metadata?.tenantId;
          
          if (tenantId) {
            await fastify.prisma.tenant.update({
              where: { id: tenantId },
              data: {
                subscriptionStatus: 'cancelled',
                subscriptionEndDate: new Date(),
              }
            });
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          fastify.log.info(`Payment succeeded for invoice ${invoice.id}`);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          fastify.log.warn(`Payment failed for invoice ${invoice.id}`);
          
          // TODO: Envoyer un email au client
          break;
        }
      }

      return { received: true };
    } catch (error) {
      fastify.log.error('Error processing webhook:', error);
      return reply.code(500).send({ error: 'Webhook processing failed' });
    }
  });
}