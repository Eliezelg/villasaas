"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./auth.dto");
const swagger_schemas_1 = require("../../utils/swagger-schemas");
async function authRoutes(fastify) {
    const authService = new auth_service_1.AuthService(fastify);
    // Register
    fastify.post('/register', {
        schema: {
            tags: [swagger_schemas_1.swaggerTags.auth],
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
            const validatedData = auth_dto_1.registerSchema.parse(request.body);
            const result = await authService.register(validatedData);
            reply.status(201).send(result);
        }
        catch (error) {
            if (error.message === 'Email already registered') {
                reply.status(409).send({ error: 'Email already registered' });
            }
            else {
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
            const validatedData = auth_dto_1.loginSchema.parse(request.body);
            const result = await authService.login(validatedData);
            reply.send(result);
        }
        catch (error) {
            if (error.message === 'Invalid credentials' || error.message === 'Account is disabled') {
                reply.status(401).send({ error: error.message });
            }
            else {
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
            const body = request.body;
            const result = await authService.refreshToken(body.refreshToken);
            reply.send(result);
        }
        catch (error) {
            reply.status(401).send({ error: 'Invalid refresh token' });
        }
    });
    // Logout
    fastify.post('/logout', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        await authService.logout(request.user.userId);
        reply.send({ message: 'Logged out successfully' });
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
        const body = request.body;
        try {
            let user;
            if (body.token) {
                // Vérification par token (lien email)
                const decoded = fastify.jwt.verify(body.token);
                if (decoded.type !== 'email-verification') {
                    reply.status(400).send({ error: 'Invalid token type' });
                    return;
                }
                user = await fastify.prisma.user.update({
                    where: { id: decoded.userId },
                    data: { emailVerified: true },
                });
            }
            else if (body.email && body.code) {
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
                // Simuler la vérification du code
                if (body.code === '123456') {
                    user = await fastify.prisma.user.update({
                        where: { id: user.id },
                        data: { emailVerified: true },
                    });
                }
                else {
                    reply.status(400).send({ error: 'Invalid verification code' });
                    return;
                }
            }
            else {
                reply.status(400).send({ error: 'Invalid request' });
                return;
            }
            reply.send({ message: 'Email verified successfully', user });
        }
        catch (error) {
            if (error.name === 'JsonWebTokenError') {
                reply.status(400).send({ error: 'Invalid or expired token' });
            }
            else {
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
        const { email } = request.body;
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
//# sourceMappingURL=auth.routes.js.map