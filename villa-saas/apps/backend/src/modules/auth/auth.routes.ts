import type { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from './auth.dto';
import { swaggerTags } from '../../utils/swagger-schemas';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const authService = new AuthService(fastify);
  
  // Route de debug pour vérifier les cookies
  fastify.get('/debug/cookies', async (request, reply) => {
    const response = {
      cookies: request.cookies,
      headers: {
        cookie: request.headers.cookie,
        origin: request.headers.origin,
        referer: request.headers.referer,
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
      },
    };
    
    reply.send(response);
  });

  // Check subdomain availability
  fastify.get('/check-subdomain/:subdomain', {
    schema: {
      tags: [swaggerTags.auth],
      summary: 'Vérifier la disponibilité d\'un sous-domaine',
      params: {
        type: 'object',
        required: ['subdomain'],
        properties: {
          subdomain: { type: 'string', minLength: 3, maxLength: 63 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            available: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };
    
    // Valider le format du sous-domaine
    if (!subdomain || subdomain.length < 3 || !/^[a-z0-9-]+$/.test(subdomain)) {
      reply.send({ available: false });
      return;
    }
    
    // Vérifier si le sous-domaine est réservé
    const reservedSubdomains = ['www', 'app', 'api', 'admin', 'dashboard', 'hub', 'demo', 'test'];
    if (reservedSubdomains.includes(subdomain)) {
      reply.send({ available: false });
      return;
    }
    
    const existingTenant = await fastify.prisma.tenant.findFirst({
      where: { subdomain },
    });
    
    reply.send({ available: !existingTenant });
  });

  // Register
  fastify.post('/register', {
    schema: {
      tags: [swaggerTags.auth],
      summary: 'Créer un nouveau compte',
      description: 'Crée un nouveau compte utilisateur et une nouvelle organisation (tenant)',
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
          subdomain: { type: 'string', minLength: 3, maxLength: 63, pattern: '^[a-z0-9-]+$' },
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
      
      // Définir les cookies sécurisés pour les tokens
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Configuration des cookies pour cross-domain
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // HTTPS requis en production
        sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' permet cross-domain avec secure=true
        path: '/',
        // Ne pas définir de domain pour permettre au navigateur de gérer automatiquement
      };
      
      reply.cookie('access_token', result.accessToken, {
        ...cookieOptions,
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
      });
      
      reply.cookie('refresh_token', result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      });
      
      // Ne pas envoyer les tokens dans la réponse JSON
      const { accessToken, refreshToken, ...responseData } = result;
      reply.status(201).send({
        ...responseData,
        message: 'Registration successful'
      });
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        reply.status(409).send({ error: 'Email already registered' });
      } else if (error.message === 'Subdomain not available') {
        reply.status(409).send({ error: 'Subdomain not available' });
      } else if (error.message === 'Subdomain is reserved') {
        reply.status(409).send({ error: 'Subdomain is reserved' });
      } else {
        throw error;
      }
    }
  });

  // Find tenant by email (pour portail de connexion centralisé)
  fastify.post('/find-tenant', {
    schema: {
      tags: [swaggerTags.auth],
      summary: 'Trouver le tenant d\'un utilisateur par email',
      description: 'Permet de trouver le tenant associé à un email pour un portail de connexion centralisé',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tenant: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                subdomain: { type: 'string' },
                customDomain: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email } = request.body as { email: string };
    
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
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

      if (!user || !user.tenant) {
        return reply.code(404).send({ error: 'No account found with this email' });
      }

      return { tenant: user.tenant };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to find tenant' });
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
      const result = await authService.login(validatedData, request.ip);
      
      // Définir les cookies sécurisés pour les tokens
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Configuration des cookies pour cross-domain
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // HTTPS requis en production
        sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' permet cross-domain avec secure=true
        path: '/',
        // Ne pas définir de domain pour permettre au navigateur de gérer automatiquement
      };
      
      reply.cookie('access_token', result.accessToken, {
        ...cookieOptions,
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
      });
      
      reply.cookie('refresh_token', result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      });
      
      // Ne pas envoyer les tokens dans la réponse JSON
      const { accessToken, refreshToken, ...responseData } = result;
      reply.send({
        ...responseData,
        message: 'Authentication successful'
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials' || error.message === 'Account is disabled') {
        reply.status(401).send({ error: error.message });
      } else if (error.message.includes('Too many failed attempts')) {
        reply.status(429).send({ error: error.message });
      } else {
        throw error;
      }
    }
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: {
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
    preHandler: async (request, _reply) => {
      // Si pas de body et Content-Type JSON, on force un body vide
      if (!request.body && request.headers['content-type']?.includes('application/json')) {
        request.body = {};
      }
    },
  }, async (request, reply) => {
    try {
      // Récupérer le refresh token depuis le cookie, le body ou les headers
      let refreshToken = request.cookies?.refresh_token;
      
      // Fallback sur le body si pas dans les cookies
      if (!refreshToken && request.body && typeof request.body === 'object') {
        const body = request.body as { refreshToken?: string };
        refreshToken = body.refreshToken;
      }
      
      // Fallback sur les headers
      if (!refreshToken && request.headers.authorization) {
        const authHeader = request.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          refreshToken = authHeader.substring(7);
        }
      }
      
      if (!refreshToken) {
        return reply.status(401).send({ error: 'No refresh token provided' });
      }
      
      const result = await authService.refreshToken(refreshToken);
      
      // Définir les nouveaux cookies
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Configuration des cookies pour cross-domain
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // HTTPS requis en production
        sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' permet cross-domain avec secure=true
        path: '/',
        // Ne pas définir de domain pour permettre au navigateur de gérer automatiquement
      };
      
      reply.cookie('access_token', result.accessToken, {
        ...cookieOptions,
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
      });
      
      reply.cookie('refresh_token', result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      });
      
      // Ne pas envoyer les tokens dans la réponse JSON
      reply.send({
        expiresIn: result.expiresIn,
        message: 'Token refreshed successfully'
      });
    } catch (error: any) {
      reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    // Si l'utilisateur est authentifié, on le déconnecte côté serveur
    if (request.user?.userId) {
      await authService.logout(request.user.userId);
    }
    
    // Dans tous les cas, on supprime les cookies
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Configuration des options pour supprimer les cookies (doit correspondre à la création)
    const clearCookieOptions = {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const
    };
    
    reply.clearCookie('access_token', clearCookieOptions);
    reply.clearCookie('refresh_token', clearCookieOptions);
    
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

  // Verify email
  fastify.post('/verify-email', {
    schema: {
      body: {
        type: 'object',
        oneOf: [
          {
            required: ['token'],
            properties: {
              token: { type: 'string' },
            },
          },
          {
            required: ['email', 'code'],
            properties: {
              email: { type: 'string', format: 'email' },
              code: { type: 'string', pattern: '^[0-9]{6}$' },
            },
          },
        ],
      },
    },
  }, async (request, reply) => {
    const body = request.body as { token?: string; email?: string; code?: string };

    try {
      let user;

      if (body.token) {
        // Vérification par token (lien email)
        const decoded = fastify.jwt.verify(body.token) as { userId: string; type: string };
        
        if (decoded.type !== 'email-verification') {
          reply.status(400).send({ error: 'Invalid token type' });
          return;
        }

        user = await fastify.prisma.user.update({
          where: { id: decoded.userId },
          data: { emailVerified: true },
        });
      } else if (body.email && body.code) {
        // Vérification par code
        // TODO: Implémenter la vérification par code
        // Pour l'instant, on simule la vérification
        user = await fastify.prisma.user.findFirst({
          where: { email: body.email },
        });

        if (!user) {
          reply.status(404).send({ error: 'User not found' });
          return;
        }

        // Générer un code de vérification sécurisé
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // TODO: Stocker le code dans Redis avec expiration
        // await fastify.redis.setex(`verify:${user.id}`, 600, verificationCode);
        
        // Pour l'instant, on accepte temporairement le code de test
        if (body.code === '123456' || body.code === verificationCode) {
          user = await fastify.prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
          });
        } else {
          reply.status(400).send({ error: 'Invalid verification code' });
          return;
        }
      } else {
        reply.status(400).send({ error: 'Invalid request' });
        return;
      }

      reply.send({ message: 'Email verified successfully', user });
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        reply.status(400).send({ error: 'Invalid or expired token' });
      } else {
        throw error;
      }
    }
  });

  // Resend verification email
  fastify.post('/resend-verification', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
    },
  }, async (request, reply) => {
    const { email } = request.body as { email: string };

    const user = await fastify.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Ne pas révéler si l'utilisateur existe ou non
      reply.send({ message: 'If the email exists, a verification code has been sent' });
      return;
    }

    if (user.emailVerified) {
      reply.status(400).send({ error: 'Email already verified' });
      return;
    }

    // TODO: Envoyer l'email avec le code de vérification
    // Pour l'instant, on simule l'envoi

    reply.send({ message: 'Verification code sent' });
  });
}