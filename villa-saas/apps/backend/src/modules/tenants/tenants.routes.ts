import type { FastifyInstance } from 'fastify';

export async function tenantRoutes(fastify: FastifyInstance): Promise<void> {
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
}