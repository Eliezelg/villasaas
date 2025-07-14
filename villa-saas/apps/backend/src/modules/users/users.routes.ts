import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashPassword } from '@villa-saas/utils';
import { getTenantId, createTenantFilter } from '@villa-saas/utils';
import { requirePermission } from '../../middleware/rbac.middleware';
import { render } from '@react-email/components';
import UserInvitationEmail from '../../emails/templates/user-invitation';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'USER']),
  phone: z.string().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // List users
  fastify.get('/', {
    preHandler: [fastify.authenticate, requirePermission('users.read')],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    
    const users = await fastify.prisma.user.findMany({
      where: createTenantFilter(tenantId),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    reply.send(users);
  });

  // Create user
  fastify.post('/', {
    preHandler: [fastify.authenticate, requirePermission('users.write')],
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          role: { type: 'string', enum: ['ADMIN', 'USER'] },
          phone: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {

    const tenantId = getTenantId(request);
    const { email, password, firstName, lastName, role, phone } = createUserSchema.parse(request.body);

    // Vérifier si l'email existe déjà pour ce tenant
    const existingUser = await fastify.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
    });

    if (existingUser) {
      reply.status(409).send({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await fastify.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        phone,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    reply.status(201).send(user);
  });

  // Update user
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate, requirePermission('users.write')],
  }, async (request, reply) => {

    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    const { firstName, lastName, phone, isActive } = request.body as any;

    const user = await fastify.prisma.user.update({
      where: {
        id,
        tenantId,
      },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    reply.send(user);
  });

  // Delete user
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, requirePermission('users.delete')],
  }, async (request, reply) => {

    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };

    // Empêcher la suppression de soi-même
    if (id === request.user!.userId) {
      reply.status(400).send({ error: 'Cannot delete yourself' });
      return;
    }

    await fastify.prisma.user.delete({
      where: {
        id,
        tenantId,
      },
    });

    reply.status(204).send();
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
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      reply.status(404).send({ error: 'User not found' });
      return;
    }

    reply.send(user);
  });

  // Update current user
  fastify.patch('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userId = request.user!.userId;
    const { firstName, lastName, phone, onboardingCompleted } = request.body as any;

    const user = await fastify.prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(onboardingCompleted !== undefined && { 
          metadata: {
            onboardingCompleted,
            onboardingDate: new Date().toISOString(),
          }
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
      },
    });

    reply.send(user);
  });

  // Invite user
  fastify.post('/invite', {
    preHandler: [fastify.authenticate, requirePermission('users.write')],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { email, role, firstName, lastName } = inviteUserSchema.parse(request.body);

    // Vérifier si l'email existe déjà pour ce tenant
    const existingUser = await fastify.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
    });

    if (existingUser) {
      reply.status(409).send({ error: 'User with this email already exists' });
      return;
    }

    // Générer un mot de passe temporaire
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const passwordHash = await hashPassword(temporaryPassword);

    // Créer l'utilisateur avec le flag emailVerified à false
    const user = await fastify.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        tenantId,
        emailVerified: false,
        metadata: {
          invitedBy: request.user!.userId,
          invitedAt: new Date().toISOString(),
          temporaryPassword: true,
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Obtenir les informations du tenant et de l'utilisateur qui invite
    const [tenant, inviter] = await Promise.all([
      fastify.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, subdomain: true }
      }),
      fastify.prisma.user.findUnique({
        where: { id: request.user!.userId },
        select: { firstName: true, lastName: true }
      })
    ]);

    // Envoyer l'email d'invitation
    try {
      const loginUrl = process.env.NODE_ENV === 'production' 
        ? `https://${tenant?.subdomain}.${process.env.DOMAIN}/admin/login`
        : `http://localhost:3000/admin/login`;

      const emailHtml = await render(
        UserInvitationEmail({
          firstName,
          email,
          temporaryPassword,
          role,
          loginUrl,
          tenantName: tenant?.name,
          tenantLogo: undefined, // TODO: Add logo field to tenant model
          inviterName: inviter ? `${inviter.firstName} ${inviter.lastName}` : undefined,
        })
      );

      await fastify.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@villa-saas.com',
        to: email,
        subject: `Invitation to join ${tenant?.name || 'Villa SaaS'}`,
        html: emailHtml,
      });
    } catch (error) {
      fastify.log.error('Failed to send invitation email:', error);
      // Continue anyway - user is created
    }

    // Log d'audit
    await fastify.prisma.auditLog.create({
      data: {
        tenantId,
        userId: request.user!.userId,
        action: 'user.invited',
        entity: 'user',
        entityId: user.id,
        details: {
          invitedEmail: email,
          role,
        },
        ip: request.ip
      }
    });

    reply.status(201).send({ 
      message: 'User invited successfully',
      user 
    });
  });

  // Resend invitation
  fastify.post('/:id/resend-invite', {
    preHandler: [fastify.authenticate, requirePermission('users.write')],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };

    // Vérifier que l'utilisateur existe et n'a pas encore vérifié son email
    const user = await fastify.prisma.user.findFirst({
      where: {
        id,
        tenantId,
        emailVerified: false,
      },
    });

    if (!user) {
      reply.status(404).send({ error: 'User not found or already verified' });
      return;
    }

    // Vérifier que l'utilisateur a été invité (a un temporaryPassword)
    if (!user.metadata || !(user.metadata as any).temporaryPassword) {
      reply.status(400).send({ error: 'User was not invited' });
      return;
    }

    // Générer un nouveau mot de passe temporaire
    const newTemporaryPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const passwordHash = await hashPassword(newTemporaryPassword);

    // Mettre à jour le mot de passe
    await fastify.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        metadata: {
          ...(user.metadata as any),
          lastInviteResent: new Date().toISOString(),
          resentBy: request.user!.userId,
        }
      },
    });

    // Obtenir les informations du tenant
    const tenant = await fastify.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, subdomain: true }
    });

    // Renvoyer l'email d'invitation
    try {
      const loginUrl = process.env.NODE_ENV === 'production' 
        ? `https://${tenant?.subdomain}.${process.env.DOMAIN}/admin/login`
        : `http://localhost:3000/admin/login`;

      const emailHtml = await render(
        UserInvitationEmail({
          firstName: user.firstName,
          email: user.email,
          temporaryPassword: newTemporaryPassword,
          role: user.role,
          loginUrl,
          tenantName: tenant?.name,
          tenantLogo: undefined, // TODO: Add logo field to tenant model
        })
      );

      await fastify.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@villa-saas.com',
        to: user.email,
        subject: `Reminder: Invitation to join ${tenant?.name || 'Villa SaaS'}`,
        html: emailHtml,
      });
    } catch (error) {
      fastify.log.error('Failed to resend invitation email:', error);
      reply.status(500).send({ error: 'Failed to send invitation email' });
      return;
    }

    // Log d'audit
    await fastify.prisma.auditLog.create({
      data: {
        tenantId,
        userId: request.user!.userId,
        action: 'user.invitation.resent',
        entity: 'user',
        entityId: user.id,
        details: {
          userEmail: user.email,
        },
        ip: request.ip
      }
    });

    reply.send({ message: 'Invitation resent successfully' });
  });
}