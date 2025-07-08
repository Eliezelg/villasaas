"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const zod_1 = require("zod");
const utils_1 = require("@villa-saas/utils");
const utils_2 = require("@villa-saas/utils");
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    role: zod_1.z.enum(['ADMIN', 'USER']),
    phone: zod_1.z.string().optional(),
});
async function userRoutes(fastify) {
    // List users
    fastify.get('/', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const tenantId = (0, utils_2.getTenantId)(request);
        const users = await fastify.prisma.user.findMany({
            where: (0, utils_2.createTenantFilter)(tenantId),
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
        preHandler: [fastify.authenticate],
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
        // Vérifier les permissions
        if (!['OWNER', 'ADMIN'].includes(request.user.role)) {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_2.getTenantId)(request);
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
        const passwordHash = await (0, utils_1.hashPassword)(password);
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
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        // Vérifier les permissions
        if (!['OWNER', 'ADMIN'].includes(request.user.role)) {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_2.getTenantId)(request);
        const { id } = request.params;
        const { firstName, lastName, phone, isActive } = request.body;
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
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        // Seul le OWNER peut supprimer des utilisateurs
        if (request.user.role !== 'OWNER') {
            reply.status(403).send({ error: 'Forbidden' });
            return;
        }
        const tenantId = (0, utils_2.getTenantId)(request);
        const { id } = request.params;
        // Empêcher la suppression de soi-même
        if (id === request.user.userId) {
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
            where: { id: request.user.userId },
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
        const userId = request.user.userId;
        const { firstName, lastName, phone, onboardingCompleted } = request.body;
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
                metadata: true,
            },
        });
        reply.send(user);
    });
}
//# sourceMappingURL=users.routes.js.map