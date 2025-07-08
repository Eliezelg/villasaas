import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';

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
import { tenantRoutes } from './modules/tenants/tenants.routes';
import { userRoutes } from './modules/users/users.routes';
import { propertyRoutes } from './modules/properties/properties.routes';
// import { propertyImageRoutes } from './modules/properties/images.routes';
import { propertyImageS3Routes } from './modules/properties/images-s3.routes';
import { periodRoutes } from './modules/periods/periods.routes';
import { pricingRoutes } from './modules/pricing/pricing.routes';
import availabilityRoutes from './modules/availability/availability.routes';
import { bookingRoutes } from './modules/bookings/booking.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { publicRoutes } from './modules/public/public.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';
import { promocodesRoutes } from './modules/promocodes/promocodes.routes';
import { publicPromoCodesRoutes } from './modules/public/promocodes.public.routes';
import { messagingRoutes } from './modules/messaging/messaging.routes';
import { autoResponseRoutes } from './modules/messaging/auto-response.routes';
import { bookingOptionsRoutes } from './modules/booking-options/booking-options.routes';

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts);

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Core plugins
  await app.register(cors, {
    origin: (origin, cb) => {
      // Permettre les requêtes depuis localhost avec n'importe quel port et sous-domaine
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3002',
        /^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/,  // Sous-domaines de localhost:3000 (app unifiée)
        /^http:\/\/[a-zA-Z0-9-]+\.localhost:3002$/,  // Sous-domaines de localhost:3002
        /^http:\/\/localhost:\d+$/,  // N'importe quel port localhost
      ];
      
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
        cb(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
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

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 10, // Max 10 files per request
    },
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
  await app.register(tenantRoutes, { prefix: '/api/tenants' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(propertyRoutes, { prefix: '/api/properties' });
  // await app.register(propertyImageRoutes, { prefix: '/api/properties' }); // Old local storage
  await app.register(propertyImageS3Routes, { prefix: '/api/properties' }); // New S3 storage
  await app.register(periodRoutes, { prefix: '/api/periods' });
  await app.register(pricingRoutes, { prefix: '/api/pricing' });
  await app.register(availabilityRoutes, { prefix: '/api/availability' });
  await app.register(bookingRoutes, { prefix: '/api' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(paymentsRoutes, { prefix: '/api' });
  await app.register(promocodesRoutes, { prefix: '/api' });
  await app.register(messagingRoutes, { prefix: '/api/messaging' });
  await app.register(autoResponseRoutes, { prefix: '/api/messaging/auto-response' });
  await app.register(bookingOptionsRoutes, { prefix: '/api' });
  
  // Public routes (no auth required)
  await app.register(publicRoutes, { prefix: '/api' });
  await app.register(publicPromoCodesRoutes, { prefix: '/api' });

  return app;
}