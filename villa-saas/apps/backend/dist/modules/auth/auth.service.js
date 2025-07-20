"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const utils_1 = require("@villa-saas/utils");
const crypto_1 = require("crypto");
class AuthService {
    fastify;
    constructor(fastify) {
        this.fastify = fastify;
    }
    async register(data) {
        const { email, password, firstName, lastName, companyName, phone, subdomain, domainOption } = data;
        // Vérifier si l'email existe déjà
        const existingTenant = await this.fastify.prisma.tenant.findUnique({
            where: { email },
        });
        if (existingTenant) {
            throw new Error('Email already registered');
        }
        // Déterminer le sous-domaine à utiliser
        const finalSubdomain = subdomain || this.generateSubdomain(companyName);
        // Vérifier si le sous-domaine est disponible
        const existingSubdomain = await this.fastify.prisma.tenant.findFirst({
            where: { subdomain: finalSubdomain },
        });
        if (existingSubdomain) {
            throw new Error('Subdomain not available');
        }
        // Vérifier que le sous-domaine n'est pas réservé
        const reservedSubdomains = ['www', 'app', 'api', 'admin', 'dashboard', 'hub', 'demo', 'test'];
        if (reservedSubdomains.includes(finalSubdomain)) {
            throw new Error('Subdomain is reserved');
        }
        // Hasher le mot de passe
        const passwordHash = await (0, utils_1.hashPassword)(password);
        // Créer le tenant et l'utilisateur owner dans une transaction
        const result = await this.fastify.prisma.$transaction(async (prisma) => {
            // Créer le tenant
            const tenant = await prisma.tenant.create({
                data: {
                    email,
                    name: `${firstName} ${lastName}`,
                    companyName,
                    phone,
                    subdomain: finalSubdomain,
                    settings: {
                        domainOption: domainOption || 'subdomain',
                        currency: 'EUR',
                        timezone: 'Europe/Paris',
                        language: 'fr',
                    },
                },
            });
            // Créer l'utilisateur owner
            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    phone,
                    tenantId: tenant.id,
                    role: 'OWNER',
                    emailVerified: false,
                },
            });
            // Créer le site public avec configuration par défaut
            await prisma.publicSite.create({
                data: {
                    tenantId: tenant.id,
                    subdomain: subdomain || finalSubdomain,
                    isActive: true,
                    theme: {
                        primaryColor: '#6366F1', // Purple-600
                        secondaryColor: '#4F46E5', // Purple-700
                        font: 'Inter',
                    },
                    metadata: {
                        title: companyName,
                        description: `Bienvenue chez ${companyName}`,
                        seoTitle: companyName,
                        seoDescription: `Découvrez et réservez votre séjour chez ${companyName}`,
                        contactEmail: email,
                        contactPhone: phone,
                        socialLinks: {},
                        footer: {
                            showSocial: true,
                            showContact: true,
                            customText: null,
                        },
                    },
                    defaultLocale: 'fr',
                    locales: ['fr', 'en'],
                },
            });
            return { tenant, user };
        });
        // Générer les tokens
        const tokens = await this.generateTokens(result.user);
        return {
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
            ...tokens,
        };
    }
    async login(data, ipAddress) {
        const { email, password } = data;
        // Protection contre le brute force
        if (ipAddress && this.fastify.redis) {
            const attemptsKey = `login_attempts:${email}:${ipAddress}`;
            const attempts = await this.fastify.redis.incr(attemptsKey);
            if (attempts === 1) {
                // Définir l'expiration sur la première tentative
                await this.fastify.redis.expire(attemptsKey, 900); // 15 minutes
            }
            if (attempts > 5) {
                // Log de sécurité
                // Pour les logs système sans tenant associé, on omet le tenantId
                // Note: Il faudrait idéalement modifier le schéma pour rendre tenantId optionnel
                this.fastify.log.warn('Login blocked - too many attempts', { email, ip: ipAddress, attempts });
                throw new Error('Too many failed attempts. Please try again later.');
            }
        }
        // Trouver l'utilisateur avec son tenant
        const user = await this.fastify.prisma.user.findFirst({
            where: { email },
            include: { tenant: true },
        });
        if (!user) {
            // Log d'échec de connexion
            if (ipAddress) {
                // Log d'échec sans tenant car l'utilisateur n'existe pas
                this.fastify.log.warn('Login failed - user not found', { email, ip: ipAddress });
            }
            throw new Error('Invalid credentials');
        }
        // Vérifier le mot de passe
        const isValid = await (0, utils_1.verifyPassword)(user.passwordHash, password);
        if (!isValid) {
            // Log d'échec de connexion
            await this.fastify.prisma.auditLog.create({
                data: {
                    action: 'auth.login.failed',
                    entity: 'user',
                    entityId: user.id,
                    details: { email, reason: 'invalid_password' },
                    ip: ipAddress,
                    tenantId: user.tenantId,
                }
            });
            throw new Error('Invalid credentials');
        }
        // Vérifier que le compte est actif
        if (!user.isActive || !user.tenant.isActive) {
            await this.fastify.prisma.auditLog.create({
                data: {
                    action: 'auth.login.failed',
                    entity: 'user',
                    entityId: user.id,
                    details: { email, reason: 'account_disabled' },
                    ip: ipAddress,
                    tenantId: user.tenantId,
                }
            });
            throw new Error('Account is disabled');
        }
        // Réinitialiser les tentatives de connexion en cas de succès
        if (ipAddress && this.fastify.redis) {
            const attemptsKey = `login_attempts:${email}:${ipAddress}`;
            await this.fastify.redis.del(attemptsKey);
        }
        // Générer les tokens
        const tokens = await this.generateTokens(user);
        // Créer une session
        await this.fastify.prisma.session.create({
            data: {
                userId: user.id,
                token: tokens.accessToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
                ip: ipAddress,
            },
        });
        // Log de connexion réussie
        await this.fastify.prisma.auditLog.create({
            data: {
                action: 'auth.login.success',
                entity: 'user',
                entityId: user.id,
                details: { email },
                ip: ipAddress,
                tenantId: user.tenantId,
                userId: user.id,
            }
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
                subdomain: user.tenant.subdomain,
            },
            ...tokens,
        };
    }
    async refreshToken(refreshToken) {
        // Vérifier le refresh token
        const storedToken = await this.fastify.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: {
                user: {
                    include: { tenant: true },
                },
            },
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            // Log de sécurité pour token invalide
            // Log de sécurité pour token invalide
            this.fastify.log.warn('Refresh token failed', {
                reason: !storedToken ? 'token_not_found' : 'token_expired'
            });
            throw new Error('Invalid refresh token');
        }
        // Supprimer l'ancien token (rotation)
        await this.fastify.prisma.refreshToken.delete({
            where: { id: storedToken.id }
        });
        // Générer de nouveaux tokens
        const tokens = await this.generateTokens(storedToken.user);
        // Log de succès
        await this.fastify.prisma.auditLog.create({
            data: {
                action: 'auth.refresh.success',
                entity: 'refresh_token',
                entityId: storedToken.id,
                userId: storedToken.userId,
                tenantId: storedToken.user.tenantId,
            }
        });
        return tokens;
    }
    async logout(userId) {
        // Supprimer tous les refresh tokens de l'utilisateur
        await this.fastify.prisma.refreshToken.deleteMany({
            where: { userId },
        });
        // Supprimer toutes les sessions
        await this.fastify.prisma.session.deleteMany({
            where: { userId },
        });
    }
    async generateTokens(user) {
        // Ne pas inclure les permissions dans le JWT car elles sont déterminées par le rôle
        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            role: user.role,
        };
        // Access token
        const accessToken = await this.fastify.jwt.sign(payload, {
            expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
        });
        // Refresh token
        const refreshToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const refreshExpiresAt = new Date(Date.now() + this.parseExpiration(process.env.JWT_REFRESH_EXPIRATION || '7d'));
        // Sauvegarder le refresh token
        await this.fastify.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: refreshExpiresAt,
            },
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes
        };
    }
    generateSubdomain(companyName) {
        return companyName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 30);
    }
    parseExpiration(exp) {
        const match = exp.match(/^(\d+)([dhms])$/);
        if (!match)
            return 7 * 24 * 60 * 60 * 1000; // 7 jours par défaut
        const [, num, unit] = match;
        const value = parseInt(num, 10);
        switch (unit) {
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'm': return value * 60 * 1000;
            case 's': return value * 1000;
            default: return 7 * 24 * 60 * 60 * 1000;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map