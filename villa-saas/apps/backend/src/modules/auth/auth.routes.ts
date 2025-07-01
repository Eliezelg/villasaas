import type { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from './auth.dto';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const authService = new AuthService(fastify);

  // Register
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'companyName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 100 },
          firstName: { type: 'string', minLength: 1, maxLength: 50 },
          lastName: { type: 'string', minLength: 1, maxLength: 50 },
          companyName: { type: 'string', minLength: 1, maxLength: 100 },
          phone: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
              },
            },
            tenant: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                subdomain: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Valider avec Zod pour une validation plus stricte
      const validatedData = registerSchema.parse(request.body);
      const result = await authService.register(validatedData);
      reply.status(201).send(result);
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        reply.status(409).send({ error: 'Email already registered' });
      } else {
        throw error;
      }
    }
  });

  // Login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
              },
            },
            tenant: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                subdomain: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const validatedData = loginSchema.parse(request.body);
      const result = await authService.login(validatedData);
      reply.send(result);
    } catch (error: any) {
      if (error.message === 'Invalid credentials' || error.message === 'Account is disabled') {
        reply.status(401).send({ error: error.message });
      } else {
        throw error;
      }
    }
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const body = request.body as { refreshToken: string };
      const result = await authService.refreshToken(body.refreshToken);
      reply.send(result);
    } catch (error: any) {
      reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Logout
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    await authService.logout(request.user!.userId);
    reply.send({ message: 'Logged out successfully' });
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            customDomain: true,
          },
        },
      },
    });

    if (!user) {
      reply.status(404).send({ error: 'User not found' });
      return;
    }

    reply.send(user);
  });
}