import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { swaggerTags } from '../../utils/swagger-schemas';

// Schema pour l'étape 1 : création du compte basique
const signupStep1Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function authSignupRoutes(fastify: FastifyInstance) {
  // Étape 1 : Créer le compte avec email/password seulement
  fastify.post('/auth/signup/step1', {
    schema: {
      tags: [swaggerTags.auth],
      summary: 'Signup - Étape 1 : Créer le compte',
      description: 'Crée un compte utilisateur avec email et mot de passe uniquement',
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
    const validation = signupStep1Schema.safeParse(request.body);
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

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer un tenant temporaire avec des valeurs par défaut
    const tenant = await fastify.prisma.tenant.create({
      data: {
        name: email.split('@')[0] || 'Company', // Nom temporaire basé sur l'email
        email,
        subdomain: `temp-${Date.now()}`, // Subdomain temporaire unique
        isActive: true,
        settings: {},
      },
    });

    // Créer l'utilisateur avec des valeurs temporaires
    const user = await fastify.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: '', // Sera rempli à l'étape 2
        lastName: '', // Sera rempli à l'étape 2
        role: 'OWNER',
        isActive: true,
        emailVerified: true, // On peut mettre false et envoyer un email de vérification
        tenantId: tenant.id,
      },
    });

    // Générer les tokens
    const accessToken = fastify.jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        tenantId: tenant.id,
        role: user.role,
      },
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
    );

    // Générer un refresh token simple (sans JWT)
    const refreshToken = require('crypto').randomBytes(32).toString('hex');

    // Sauvegarder le refresh token
    await fastify.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
    });

    // Définir les cookies
    reply.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    reply.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    // Log d'audit
    await fastify.prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: 'auth.signup.step1',
        entity: 'user',
        entityId: user.id,
        details: {
          email: user.email,
          step: 1,
        },
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
      accessToken,
      expiresIn: 900, // 15 minutes en secondes
    });
  });
}