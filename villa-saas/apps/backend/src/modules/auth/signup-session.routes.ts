import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { swaggerTags } from '../../utils/swagger-schemas';

// Schemas de validation pour chaque étape
const createSessionSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const updatePersonalInfoSchema = z.object({
  sessionToken: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string().default('FR'),
  subdomain: z.string()
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(30, 'Le sous-domaine doit contenir au maximum 30 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le sous-domaine ne peut contenir que des lettres minuscules, des chiffres et des tirets')
    .regex(/^[a-z0-9]/, 'Le sous-domaine doit commencer par une lettre ou un chiffre')
    .regex(/[a-z0-9]$/, 'Le sous-domaine doit se terminer par une lettre ou un chiffre'),
});

const updatePlanSchema = z.object({
  sessionToken: z.string(),
  plan: z.enum(['starter', 'standard', 'enterprise']),
  stripeSessionId: z.string().optional(),
});

const completeSignupSchema = z.object({
  sessionToken: z.string(),
  // Plus besoin des champs de propriété - elle sera créée pendant l'onboarding
});

export async function signupSessionRoutes(fastify: FastifyInstance) {
  // Étape 1: Créer une session de signup
  fastify.post('/auth/signup/session', {
    schema: {
      tags: [swaggerTags.auth],
      summary: 'Créer une session de signup',
      description: 'Initialise une session de signup temporaire avec email et mot de passe',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 100 },
        },
      },
    },
  }, async (request, reply) => {
    const validation = createSessionSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { email, password } = validation.data;

    // Vérifier si l'email existe déjà
    const existingUser = await fastify.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.code(409).send({ 
        error: 'Email already exists',
        message: 'Cet email est déjà utilisé' 
      });
    }

    // Vérifier si une session existe déjà pour cet email
    const existingSession = await fastify.prisma.signupSession.findFirst({
      where: { 
        email,
        expiresAt: { gt: new Date() }
      },
    });

    if (existingSession) {
      // Mettre à jour la session existante
      const passwordHash = await bcrypt.hash(password, 10);
      const updatedSession = await fastify.prisma.signupSession.update({
        where: { id: existingSession.id },
        data: {
          passwordHash,
          currentStep: 1,
          completedSteps: JSON.stringify([1]),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Renouveler pour 24h
        },
      });

      return reply.status(200).send({
        sessionToken: updatedSession.sessionToken,
        currentStep: updatedSession.currentStep,
        email: updatedSession.email,
      });
    }

    // Créer une nouvelle session
    const passwordHash = await bcrypt.hash(password, 10);
    const session = await fastify.prisma.signupSession.create({
      data: {
        email,
        passwordHash,
        currentStep: 1,
        completedSteps: JSON.stringify([1]),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
      },
    });

    reply.status(201).send({
      sessionToken: session.sessionToken,
      currentStep: session.currentStep,
      email: session.email,
    });
  });

  // Étape 2: Mettre à jour les informations personnelles
  fastify.post('/auth/signup/personal-info', {
    schema: {
      tags: [swaggerTags.auth],
      summary: 'Mettre à jour les informations personnelles',
      description: 'Ajoute les informations personnelles à la session de signup',
    },
  }, async (request, reply) => {
    const validation = updatePersonalInfoSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { sessionToken, subdomain, ...personalInfo } = validation.data;

    // Récupérer la session
    const session = await fastify.prisma.signupSession.findUnique({
      where: { sessionToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return reply.code(404).send({ 
        error: 'Session not found or expired',
        message: 'Session introuvable ou expirée' 
      });
    }

    // Vérifier la disponibilité du subdomain
    if (subdomain) {
      // Liste des sous-domaines réservés
      const reservedSubdomains = [
        'www', 'app', 'api', 'admin', 'dashboard', 'blog', 'shop', 'store',
        'help', 'support', 'docs', 'documentation', 'status', 'mail', 'email',
        'ftp', 'ssh', 'vpn', 'test', 'dev', 'staging', 'prod', 'production',
        'demo', 'example', 'sample', 'preview', 'beta', 'alpha', 'auth',
        'login', 'signup', 'register', 'account', 'user', 'users', 'profile',
        'settings', 'config', 'configuration', 'public', 'private', 'secure',
        'villa', 'villasaas', 'villa-saas', 'tenant', 'client', 'customer'
      ];

      if (reservedSubdomains.includes(subdomain.toLowerCase())) {
        return reply.code(400).send({ 
          error: 'Subdomain reserved',
          message: 'Ce sous-domaine est réservé' 
        });
      }

      // Vérifier dans la table Tenant
      const existingTenant = await fastify.prisma.tenant.findFirst({
        where: {
          subdomain: subdomain.toLowerCase(),
          id: { not: session.id }, // Exclure la session actuelle
        },
      });

      // Vérifier dans la table PublicSite
      const existingPublicSite = await fastify.prisma.publicSite.findFirst({
        where: {
          subdomain: subdomain.toLowerCase(),
        },
      });

      if (existingTenant || existingPublicSite) {
        return reply.code(400).send({ 
          error: 'Subdomain not available',
          message: 'Ce sous-domaine n\'est pas disponible' 
        });
      }
    }

    // Mettre à jour la session
    const updatedSession = await fastify.prisma.signupSession.update({
      where: { id: session.id },
      data: {
        ...personalInfo,
        subdomain: subdomain?.toLowerCase(),
        currentStep: 2,
        completedSteps: JSON.stringify(
          Array.isArray(session.completedSteps) 
            ? [...(session.completedSteps as number[]), 2]
            : [...JSON.parse(session.completedSteps as string || '[]'), 2]
        ),
      },
    });

    reply.send({
      sessionToken: updatedSession.sessionToken,
      currentStep: updatedSession.currentStep,
    });
  });

  // Étape 3: Sélectionner le plan et initier le paiement
  fastify.post('/auth/signup/select-plan', {
    schema: {
      tags: [swaggerTags.auth],
      summary: 'Sélectionner un plan d\'abonnement',
      description: 'Enregistre le plan sélectionné dans la session',
    },
  }, async (request, reply) => {
    const validation = updatePlanSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { sessionToken, plan, stripeSessionId } = validation.data;

    // Récupérer la session
    const session = await fastify.prisma.signupSession.findUnique({
      where: { sessionToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return reply.code(404).send({ 
        error: 'Session not found or expired',
        message: 'Session introuvable ou expirée' 
      });
    }

    // Mettre à jour la session
    const updatedSession = await fastify.prisma.signupSession.update({
      where: { id: session.id },
      data: {
        selectedPlan: plan,
        stripeSessionId: stripeSessionId || null,
        currentStep: 3,
        completedSteps: JSON.stringify(
          Array.isArray(session.completedSteps) 
            ? [...(session.completedSteps as number[]), 3]
            : [...JSON.parse(session.completedSteps as string || '[]'), 3]
        ),
      },
    });

    reply.send({
      sessionToken: updatedSession.sessionToken,
      currentStep: updatedSession.currentStep,
    });
  });

  // Étape 4: Finaliser l'inscription et créer le compte
  fastify.post('/auth/signup/complete', {
    schema: {
      tags: [swaggerTags.auth],
      summary: 'Finaliser l\'inscription',
      description: 'Crée le compte utilisateur, le tenant et la première propriété',
    },
  }, async (request, reply) => {
    const validation = completeSignupSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { sessionToken } = validation.data;

    // Récupérer la session complète
    const session = await fastify.prisma.signupSession.findUnique({
      where: { sessionToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return reply.code(404).send({ 
        error: 'Session not found or expired',
        message: 'Session introuvable ou expirée' 
      });
    }

    // Vérifier que toutes les étapes sont complétées
    const completedSteps = Array.isArray(session.completedSteps) 
      ? session.completedSteps as number[]
      : JSON.parse(session.completedSteps as string || '[]');
    if (!completedSteps.includes(1) || !completedSteps.includes(2) || !completedSteps.includes(3)) {
      return reply.code(400).send({ 
        error: 'Incomplete signup',
        message: 'Toutes les étapes doivent être complétées' 
      });
    }

    // Vérifier le paiement Stripe et récupérer les infos
    let stripeCustomerId: string | null = null;
    let stripeSubscriptionId: string | null = null;
    
    if (session.selectedPlan !== 'enterprise' && session.stripeSessionId) {
      try {
        const stripeSession = await fastify.stripe.checkout.sessions.retrieve(session.stripeSessionId, {
          expand: ['subscription', 'customer'],
        });
        
        // Vérifier que le paiement est complété
        if (stripeSession.payment_status !== 'paid') {
          return reply.code(400).send({ 
            error: 'Payment not completed',
            message: 'Le paiement doit être complété avant de finaliser l\'inscription' 
          });
        }
        
        // Récupérer les IDs Stripe
        stripeCustomerId = typeof stripeSession.customer === 'string' 
          ? stripeSession.customer 
          : stripeSession.customer?.id || null;
          
        stripeSubscriptionId = typeof stripeSession.subscription === 'string'
          ? stripeSession.subscription
          : stripeSession.subscription?.id || null;
        
        fastify.log.info('Stripe payment verified:', {
          id: stripeSession.id,
          payment_status: stripeSession.payment_status,
          customer_id: stripeCustomerId,
          subscription_id: stripeSubscriptionId,
        });
      } catch (error) {
        fastify.log.error('Error verifying Stripe payment:', error);
        return reply.code(400).send({ 
          error: 'Payment verification failed',
          message: 'Impossible de vérifier le paiement' 
        });
      }
    }

    // Commencer une transaction pour créer tout en une fois
    const result = await fastify.prisma.$transaction(async (prisma) => {
      // 1. Créer le tenant avec le subdomain choisi
      const tenantSubdomain = session.subdomain || `tenant-${Date.now()}`; // Utiliser le subdomain choisi ou un temporaire
      const tenant = await prisma.tenant.create({
        data: {
          name: session.companyName || `${session.firstName} ${session.lastName}`.trim() || 'Ma société',
          email: session.email,
          subdomain: tenantSubdomain,
          customDomain: null,
          isActive: true,
          settings: {},
          address: session.address,
          city: session.city,
          postalCode: session.postalCode,
          country: session.country || 'FR',
          subscriptionPlan: session.selectedPlan,
          subscriptionStatus: session.selectedPlan === 'enterprise' ? 'pending' : 'active',
          stripeCustomerId: stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId
        },
      });

      // 2. Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: session.email,
          passwordHash: session.passwordHash!,
          firstName: session.firstName || '',
          lastName: session.lastName || '',
          phone: session.phone,
          role: 'OWNER',
          isActive: true,
          emailVerified: false, // Nécessitera une vérification
          tenantId: tenant.id,
        },
      });

      // 3. Créer automatiquement le PublicSite avec le subdomain du tenant
      const publicSite = await prisma.publicSite.create({
        data: {
          tenantId: tenant.id,
          subdomain: tenantSubdomain,
          domain: null, // Sera configuré plus tard si l'utilisateur veut un domaine personnalisé
          theme: {
            primaryColor: '#6B46C1',
            secondaryColor: '#9333EA',
            fontFamily: 'Inter',
            showPrices: true,
            allowBooking: true,
            showAvailability: true,
          },
          isActive: true,
          logo: null,
          favicon: null,
          metadata: {
            seo: {
              title: `${tenant.name} - Locations de vacances`,
              description: `Découvrez nos propriétés disponibles à la location`,
              keywords: ['location', 'vacances', 'villa', 'appartement'],
            },
            socialLinks: {},
            analytics: {},
          },
          defaultLocale: 'fr',
          locales: ['fr'],
          googleAnalyticsId: null,
          facebookPixelId: null,
        },
      });

      // 4. Créer l'enregistrement DNS dans Cloudflare (si configuré)
      if (fastify.cloudflare) {
        try {
          await fastify.cloudflare.createSubdomainRecord(tenantSubdomain);
          fastify.log.info(`DNS record created for subdomain: ${tenantSubdomain}`);
        } catch (error) {
          fastify.log.error('Failed to create DNS record:', error);
          // Ne pas faire échouer la création du compte si Cloudflare échoue
        }
      }

      // 4b. Ajouter le domaine dans Vercel (si configuré)
      if (fastify.vercel && process.env.VERCEL_PROJECT_ID) {
        try {
          const domain = `${tenantSubdomain}.${process.env.CLOUDFLARE_DOMAIN || 'webpro200.fr'}`;
          await fastify.vercel.addDomain(domain);
          fastify.log.info(`Domain added to Vercel: ${domain}`);
        } catch (error) {
          fastify.log.error('Failed to add domain to Vercel:', error);
          // Ne pas faire échouer la création du compte si Vercel échoue
        }
      }

      // 5. Supprimer la session temporaire
      await prisma.signupSession.delete({
        where: { id: session.id },
      });

      // 6. Log d'audit
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: 'auth.signup.complete',
          entity: 'user',
          entityId: user.id,
          details: {
            email: user.email,
            plan: session.selectedPlan,
            publicSiteCreated: true,
            subdomain: tenantSubdomain,
          },
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });

      return { user, tenant, publicSite };
    });

    // Créer les tokens d'authentification (en dehors de la transaction)
    const accessToken = fastify.jwt.sign(
      { 
        userId: result.user.id,
        email: result.user.email,
        tenantId: result.tenant.id,
        role: result.user.role,
      },
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
    );

    // Générer un refresh token simple (sans JWT)
    const refreshToken = require('crypto').randomBytes(32).toString('hex');

    // Sauvegarder le refresh token
    await fastify.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: result.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Définir les cookies
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Configuration des cookies pour cross-domain
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS requis en production
      sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' permet cross-domain avec secure=true
      path: '/',
      // Ne pas définir de domain pour permettre au navigateur de gérer automatiquement
    };
    
    reply.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    reply.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // TODO: Envoyer un email de bienvenue
    // await fastify.emailService.sendWelcomeEmail(result.user.email, result.user.firstName);

    reply.status(201).send({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
        customDomain: result.tenant.customDomain,
      },
    });
  });

  // Récupérer les informations d'une session
  fastify.get('/auth/signup/session/:token', {
    schema: {
      tags: [swaggerTags.auth],
      summary: 'Récupérer les informations de session',
      description: 'Récupère l\'état actuel d\'une session de signup',
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { token } = request.params as { token: string };

    const session = await fastify.prisma.signupSession.findUnique({
      where: { sessionToken: token },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        selectedPlan: true,
        currentStep: true,
        completedSteps: true,
        expiresAt: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return reply.code(404).send({ 
        error: 'Session not found or expired',
        message: 'Session introuvable ou expirée' 
      });
    }

    reply.send({
      ...session,
      completedSteps: Array.isArray(session.completedSteps) 
        ? session.completedSteps as number[]
        : JSON.parse(session.completedSteps as string || '[]'),
    });
  });
}