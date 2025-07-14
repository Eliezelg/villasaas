import type { FastifyInstance } from 'fastify';
import * as z from 'zod';
import * as bcrypt from 'bcryptjs';

const tenantRegisterSchema = z.object({
  // Informations entreprise
  companyName: z.string().min(1).max(100),
  subdomain: z.string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9-]+$/)
    .regex(/^[a-z0-9]/)
    .regex(/[a-z0-9]$/),
  
  // Informations personnelles
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  
  // Mot de passe
  password: z.string().min(8),
});

export async function tenantRoutes(fastify: FastifyInstance): Promise<void> {
  // Check subdomain availability (public endpoint)
  fastify.get('/check-subdomain/:subdomain', async (request, reply) => {
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

  // Register new tenant (public endpoint)
  fastify.post('/register', async (request, reply) => {
    try {
      const validatedData = tenantRegisterSchema.parse(request.body);
      
      // Vérifier si l'email existe déjà
      const existingUser = await fastify.prisma.user.findFirst({
        where: { email: validatedData.email },
      });
      
      if (existingUser) {
        reply.status(409).send({ error: 'Cet email est déjà utilisé' });
        return;
      }
      
      // Vérifier si le sous-domaine est disponible
      const existingTenant = await fastify.prisma.tenant.findFirst({
        where: { subdomain: validatedData.subdomain },
      });
      
      if (existingTenant) {
        reply.status(409).send({ error: 'Ce sous-domaine n\'est pas disponible' });
        return;
      }
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Créer le tenant et l'utilisateur en transaction
      const result = await fastify.prisma.$transaction(async (prisma) => {
        // Créer le tenant
        const tenant = await prisma.tenant.create({
          data: {
            name: validatedData.companyName,
            companyName: validatedData.companyName,
            subdomain: validatedData.subdomain,
            email: validatedData.email,
            phone: validatedData.phone,
            // Ajouter des settings par défaut
            settings: {
              currency: 'EUR',
              timezone: 'Europe/Paris',
              language: 'fr',
              dateFormat: 'DD/MM/YYYY',
              bookingRules: {
                instantBooking: false,
                requireApproval: true,
                cancellationPolicy: 'flexible',
                checkInTime: '15:00',
                checkOutTime: '11:00',
              },
            },
          },
        });
        
        // Créer l'utilisateur principal (OWNER)
        const user = await prisma.user.create({
          data: {
            email: validatedData.email,
            passwordHash: hashedPassword,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            role: 'OWNER',
            tenantId: tenant.id,
            emailVerified: false,
            isActive: true,
          },
        });
        
        // Créer l'entrée audit log
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            action: 'TENANT_CREATED',
            entity: 'Tenant',
            entityId: tenant.id,
            details: {
              companyName: tenant.companyName,
              subdomain: tenant.subdomain,
            },
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          },
        });
        
        return { tenant, user };
      });
      
      // Générer les tokens JWT
      const accessToken = await reply.jwtSign({
        userId: result.user.id,
        tenantId: result.tenant.id,
        email: result.user.email,
        role: result.user.role
      }, { expiresIn: '7d' });
      
      // Générer un refresh token simple (non JWT)
      const refreshToken = require('crypto').randomBytes(32).toString('hex');
      
      // Créer le refresh token en DB
      await fastify.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: result.user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        },
      });
      
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
        },
        accessToken,
        refreshToken,
        expiresIn: 604800, // 7 jours en secondes
      });
      
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({ error: 'Données invalides', details: error.errors });
        return;
      }
      throw error;
    }
  });

  // Get tenant by subdomain (public endpoint for booking sites)
  fastify.get('/info/:subdomain', async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };
    
    const tenant = await fastify.prisma.tenant.findFirst({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        companyName: true,
        subdomain: true,
        customDomain: true,
        settings: true,
        // Ne pas exposer les infos sensibles
      },
    });

    if (!tenant) {
      reply.status(404).send({ error: 'Tenant not found' });
      return;
    }

    reply.send(tenant);
  });
  
  // Get current tenant
  fastify.get('/current', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenant = await fastify.prisma.tenant.findUnique({
      where: { id: request.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        subdomain: true,
        customDomain: true,
        stripeAccountId: true,
        stripeDetailsSubmitted: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        settings: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      reply.status(404).send({ error: 'Tenant not found' });
      return;
    }

    reply.send(tenant);
  });

  // Update tenant
  fastify.patch('/current', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Vérifier que l'utilisateur est OWNER
    if (request.user!.role !== 'OWNER') {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const { name, phone, companyName, siret, vatNumber } = request.body as any;

    const tenant = await fastify.prisma.tenant.update({
      where: { id: request.tenantId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(companyName && { companyName }),
        ...(siret !== undefined && { siret }),
        ...(vatNumber !== undefined && { vatNumber }),
      },
    });

    reply.send(tenant);
  });

  // Upload tenant logo
  fastify.post('/current/logo', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Vérifier que l'utilisateur est OWNER
    if (request.user!.role !== 'OWNER') {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const data = await request.file();
    
    if (!data) {
      reply.status(400).send({ error: 'No file uploaded' });
      return;
    }

    // TODO: Implémenter l'upload du logo
    // Pour l'instant, on simule le succès
    reply.status(204).send();
  });
}