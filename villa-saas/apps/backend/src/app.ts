import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';

import { errorHandler } from './utils/error-handler';
import authPlugin from './plugins/auth';
import prismaPlugin from './plugins/prisma';
import redisPlugin from './plugins/redis';

import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { tenantRoutes } from './modules/tenants/tenants.routes';
import { userRoutes } from './modules/users/users.routes';
import { propertyRoutes } from './modules/properties/properties.routes';

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts);

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Core plugins
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

  // Custom plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);

  // Routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(tenantRoutes, { prefix: '/api/tenants' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(propertyRoutes, { prefix: '/api/properties' });

  return app;
}