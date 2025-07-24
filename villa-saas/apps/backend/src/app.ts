import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rawBody from 'fastify-raw-body';

import { errorHandler } from './utils/error-handler';
import authPlugin from './plugins/auth';
import prismaPlugin from './plugins/prisma';
import redisPlugin from './plugins/redis';
import staticPlugin from './plugins/static';
import swaggerPlugin from './plugins/swagger';
import stripePlugin from './plugins/stripe';
import s3Plugin from './plugins/s3';
import resendPlugin from './plugins/resend';
import websocketPlugin from './plugins/websocket';

import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { authSignupRoutes } from './modules/auth/auth-signup.routes';
import { signupSessionRoutes } from './modules/auth/signup-session.routes';
import { tenantRoutes } from './modules/tenants/tenants.routes';
import { userRoutes } from './modules/users/users.routes';
import { propertyRoutes } from './modules/properties/properties.routes';
// import { propertyImageRoutes } from './modules/properties/images.routes';
import { propertyImageS3Routes } from './modules/properties/images-s3.routes';
import { propertyQuotaRoutes } from './modules/properties/property-quota.routes';
import { periodRoutes } from './modules/periods/periods.routes';
import { pricingRoutes } from './modules/pricing/pricing.routes';
import availabilityRoutes from './modules/availability/availability.routes';
import { bookingRoutes } from './modules/bookings/booking.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { publicRoutes } from './modules/public/public.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';
import { subscriptionsRoutes } from './modules/subscriptions/subscriptions.routes';
import { promocodesRoutes } from './modules/promocodes/promocodes.routes';
import { publicPromoCodesRoutes } from './modules/public/promocodes.public.routes';
import { messagingRoutes } from './modules/messaging/messaging.routes';
import { autoResponseRoutes } from './modules/messaging/auto-response.routes';
import { bookingOptionsRoutes } from './modules/booking-options/booking-options.routes';
import { domainsRoutes } from './modules/domains/domains.routes';
import { domainLookupRoutes } from './modules/public/domain-lookup.routes';

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts);

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Core plugins
  await app.register(cors, {
    origin: (origin, cb) => {
      // Configuration pour le développement
      const devOrigins = [
        'http://localhost:3000',
        'http://localhost:3002',
        /^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/,  // Sous-domaines de localhost:3000 (app unifiée)
        /^http:\/\/[a-zA-Z0-9-]+\.localhost:3002$/,  // Sous-domaines de localhost:3002
        /^http:\/\/localhost:\d+$/,  // N'importe quel port localhost
      ];
      
      // Configuration pour la production
      const prodOrigins = process.env.NODE_ENV === 'production' ? [
        process.env.FRONTEND_URL,
        ...(process.env.ALLOWED_BOOKING_DOMAINS?.split(',') || []),
        // Ajouter explicitement les domaines Vercel
        'https://villasaas-eight.vercel.app',
        'https://villasaas-a4wtdk312-villa-saas.vercel.app',
        /^https:\/\/villasaas.*\.vercel\.app$/,
        // Ajouter le domaine webpro200.com et ses sous-domaines
        'https://webpro200.com',
        'https://www.webpro200.com',
        /^https:\/\/[a-zA-Z0-9-]+\.webpro200\.com$/,
        // Force deployment: 2025-07-25T00:23:00Z - Using Dockerfile
      ].filter(Boolean) : [];
      
      const allowedOrigins = [...devOrigins, ...prodOrigins];
      
      // Si pas d'origine (ex: Postman), permettre
      if (!origin) {
        cb(null, true);
        return;
      }
      
      // Vérifier si l'origine est autorisée
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed) {
        cb(null, true);
      } else {
        app.log.warn(`CORS blocked origin: ${origin}`);
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:", process.env.AWS_CDN_DOMAIN || ""].filter(Boolean),
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.stripe.com", "wss:", process.env.FRONTEND_URL || ""].filter(Boolean),
        frameAncestors: ["'none'"],
        frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    originAgentCluster: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: false,
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    ieNoOpen: true,
    noSniff: true,
    xssFilter: true
  });

  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    },
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || process.env.SESSION_SECRET, // pour signer les cookies
    parseOptions: {}
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 10, // Max 10 files per request
    },
  });

  // Register raw body plugin for Stripe webhooks
  await app.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
    routes: ['/api/public/stripe/webhook', '/api/public/stripe/subscription-webhook']
  });

  // Register Swagger before routes
  await app.register(swaggerPlugin);

  // Custom plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(s3Plugin);
  await app.register(stripePlugin);
  await app.register(resendPlugin);
  await app.register(authPlugin);
  await app.register(staticPlugin);
  await app.register(websocketPlugin);

  // Routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(authSignupRoutes, { prefix: '/api' });
  await app.register(signupSessionRoutes, { prefix: '/api' });
  await app.register(tenantRoutes, { prefix: '/api/tenants' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(propertyRoutes, { prefix: '/api/properties' });
  // await app.register(propertyImageRoutes, { prefix: '/api/properties' }); // Old local storage
  await app.register(propertyImageS3Routes, { prefix: '/api/properties' }); // New S3 storage
  await app.register(propertyQuotaRoutes, { prefix: '/api' });
  await app.register(periodRoutes, { prefix: '/api/periods' });
  await app.register(pricingRoutes, { prefix: '/api/pricing' });
  await app.register(availabilityRoutes, { prefix: '/api/availability' });
  await app.register(bookingRoutes, { prefix: '/api' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(paymentsRoutes, { prefix: '/api' });
  await app.register(subscriptionsRoutes, { prefix: '/api' });
  await app.register(promocodesRoutes, { prefix: '/api' });
  await app.register(messagingRoutes, { prefix: '/api/messaging' });
  await app.register(autoResponseRoutes, { prefix: '/api/messaging' });
  await app.register(bookingOptionsRoutes, { prefix: '/api' });
  await app.register(domainsRoutes);
  
  // Public routes (no auth required)
  await app.register(publicRoutes, { prefix: '/api' });
  await app.register(publicPromoCodesRoutes, { prefix: '/api' });
  await app.register(domainLookupRoutes);

  return app;
}