import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import Stripe from 'stripe'
import { getTenantId } from '@villa-saas/utils'
import { DomainRegistrarService } from '../../services/domain-registrar.service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.basil' as any
})

// Schémas de validation
const checkDomainSchema = z.object({
  domain: z.string().regex(/^[a-z0-9-]+\.[a-z]{2,}$/, 'Format de domaine invalide')
})

const purchaseDomainSchema = z.object({
  domain: z.string().regex(/^[a-z0-9-]+\.[a-z]{2,}$/, 'Format de domaine invalide'),
  propertyId: z.string()
})

export async function domainsRoutes(fastify: FastifyInstance) {
  // Initialiser le service de registrar
  const domainRegistrar = new DomainRegistrarService(fastify);
  
  // Vérifier la disponibilité d'un domaine
  fastify.post('/api/domains/check', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const validation = checkDomainSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error })
    }

    const { domain } = validation.data

    try {
      // Vérifier si le domaine est déjà utilisé dans notre système
      const existingProperty = await fastify.prisma.property.findFirst({
        where: {
          customDomain: domain
        }
      })

      if (existingProperty) {
        return reply.send({
          available: false,
          message: 'Ce domaine est déjà utilisé'
        })
      }

      // Vérifier avec le registrar
      const checkResult = await domainRegistrar.checkAvailability(domain)
      
      return reply.send({
        available: checkResult.available,
        price: checkResult.price || 24,
        currency: checkResult.currency || 'EUR',
        message: checkResult.message
      })

    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ 
        error: { message: 'Erreur lors de la vérification du domaine' } 
      })
    }
  })

  // Créer une session Stripe pour l'achat d'un domaine
  fastify.post('/api/domains/purchase', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const validation = purchaseDomainSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error })
    }

    const { domain, propertyId } = validation.data
    const tenantId = getTenantId(request)
    const userId = request.user?.userId || ''

    try {
      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId
        }
      })

      if (!property) {
        return reply.code(404).send({ 
          error: { message: 'Propriété non trouvée' } 
        })
      }

      // Créer un enregistrement de commande de domaine
      const domainOrder = await fastify.prisma.domainOrder.create({
        data: {
          domain,
          propertyId,
          tenantId,
          userId,
          status: 'PENDING',
          price: 24
        }
      })

      // Créer une session Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Domaine ${domain}`,
                description: 'Enregistrement de domaine pour 1 an',
              },
              unit_amount: 2400, // 24€ en centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/admin/dashboard/properties/${propertyId}/domain?success=true&orderId=${domainOrder.id}`,
        cancel_url: `${process.env.FRONTEND_URL}/admin/dashboard/properties/${propertyId}/domain?canceled=true`,
        metadata: {
          domainOrderId: domainOrder.id,
          domain,
          propertyId,
          tenantId,
          userId
        }
      })

      return reply.send({
        url: session.url,
        sessionId: session.id
      })

    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ 
        error: { message: 'Erreur lors de la création de la session de paiement' } 
      })
    }
  })

  // Webhook Stripe pour confirmer l'achat du domaine
  fastify.post('/api/domains/webhook', {
    config: {
      rawBody: true
    }
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_DOMAIN_WEBHOOK_SECRET

    if (!sig || !endpointSecret) {
      return reply.code(400).send({ error: 'Missing stripe signature' })
    }

    try {
      const event = stripe.webhooks.constructEvent(
        request.body as string | Buffer,
        sig,
        endpointSecret
      )

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const { domainOrderId, domain, propertyId } = session.metadata || {}

        if (domainOrderId) {
          // Mettre à jour le statut de la commande
          await fastify.prisma.domainOrder.update({
            where: { id: domainOrderId },
            data: {
              status: 'COMPLETED',
              stripeSessionId: session.id,
              completedAt: new Date()
            }
          })

          // Mettre à jour la propriété avec le nouveau domaine
          await fastify.prisma.property.update({
            where: { id: propertyId },
            data: {
              customDomain: domain,
              domainPurchasePending: false
            }
          })

          // Obtenir les informations du tenant et de l'utilisateur
          const domainOrderDetails = await fastify.prisma.domainOrder.findUnique({
            where: { id: domainOrderId },
            include: {
              tenant: true,
              user: true,
              property: true
            }
          })

          if (domainOrderDetails) {
            // Enregistrer le domaine avec le registrar
            const registrationResult = await domainRegistrar.registerDomain(domain || '', {
              firstName: domainOrderDetails.user.firstName,
              lastName: domainOrderDetails.user.lastName,
              email: domainOrderDetails.user.email,
              phone: domainOrderDetails.user.phone || '',
              address: domainOrderDetails.tenant.address || '',
              city: domainOrderDetails.tenant.city || '',
              postalCode: domainOrderDetails.tenant.postalCode || '',
              country: domainOrderDetails.tenant.country || 'FR',
              organization: domainOrderDetails.tenant.companyName ?? undefined
            })

            if (registrationResult.success) {
              // Configurer les DNS
              await domainRegistrar.configureDNS(
                domain || '', 
                domainOrderDetails.property.subdomain || domainOrderDetails.property.id
              )
              
              fastify.log.info(`Domain ${domain} registered successfully for property ${propertyId}`)
            } else {
              fastify.log.error(`Failed to register domain ${domain}: ${registrationResult.message}`)
              
              // Marquer la commande comme échouée
              await fastify.prisma.domainOrder.update({
                where: { id: domainOrderId },
                data: {
                  status: 'FAILED'
                }
              })
            }
          }
        }
      }

      return reply.send({ received: true })

    } catch (error) {
      fastify.log.error(error)
      return reply.code(400).send({ error: 'Webhook error' })
    }
  })

  // Obtenir le statut d'une commande de domaine
  fastify.get('/api/domains/orders/:orderId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string }
    const tenantId = getTenantId(request)

    try {
      const order = await fastify.prisma.domainOrder.findFirst({
        where: {
          id: orderId,
          tenantId
        }
      })

      if (!order) {
        return reply.code(404).send({ 
          error: { message: 'Commande non trouvée' } 
        })
      }

      return reply.send(order)

    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ 
        error: { message: 'Erreur lors de la récupération de la commande' } 
      })
    }
  })

  // Obtenir le statut d'un domaine existant
  fastify.get('/api/domains/:domain/status', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { domain } = request.params as { domain: string }
    const tenantId = getTenantId(request)

    try {
      // Vérifier que le domaine appartient à une propriété du tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          customDomain: domain,
          tenantId
        }
      })

      if (!property) {
        return reply.code(404).send({ 
          error: { message: 'Domaine non trouvé' } 
        })
      }

      // Obtenir le statut du domaine
      const status = await domainRegistrar.getDomainStatus(domain)

      return reply.send({
        domain,
        status,
        propertyId: property.id
      })

    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ 
        error: { message: 'Erreur lors de la récupération du statut' } 
      })
    }
  })
}