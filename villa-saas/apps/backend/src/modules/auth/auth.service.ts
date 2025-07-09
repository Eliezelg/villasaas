import type { FastifyInstance } from 'fastify';
import type { RegisterDto, LoginDto } from './auth.dto';
import { hashPassword, verifyPassword } from '@villa-saas/utils';
import { randomBytes } from 'crypto';

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(data: RegisterDto) {
    const { email, password, firstName, lastName, companyName, phone } = data;

    // Vérifier si l'email existe déjà
    const existingTenant = await this.fastify.prisma.tenant.findUnique({
      where: { email },
    });

    if (existingTenant) {
      throw new Error('Email already registered');
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer le tenant et l'utilisateur owner dans une transaction
    const result = await this.fastify.prisma.$transaction(async (prisma) => {
      // Créer le tenant
      const tenant = await prisma.tenant.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          companyName,
          phone,
          subdomain: this.generateSubdomain(companyName),
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

  async login(data: LoginDto, ipAddress?: string) {
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
        await this.fastify.prisma.auditLog.create({
          data: {
            action: 'auth.login.blocked',
            entity: 'user',
            details: { email, ip: ipAddress, attempts },
            ip: ipAddress,
            tenantId: 'system', // Log système
          }
        });
        
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
        await this.fastify.prisma.auditLog.create({
          data: {
            action: 'auth.login.failed',
            entity: 'user',
            details: { email, reason: 'user_not_found' },
            ip: ipAddress,
            tenantId: 'system',
          }
        });
      }
      throw new Error('Invalid credentials');
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(user.passwordHash, password);
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
        lastActivity: new Date(),
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

  async refreshToken(refreshToken: string) {
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
      await this.fastify.prisma.auditLog.create({
        data: {
          action: 'auth.refresh.failed',
          entity: 'refresh_token',
          details: { reason: !storedToken ? 'token_not_found' : 'token_expired' },
          tenantId: 'system',
        }
      });
      throw new Error('Invalid refresh token');
    }

    // Vérifier si le token a déjà été utilisé (protection contre le replay)
    if (storedToken.usedAt) {
      // Token déjà utilisé - potentielle attaque
      await this.fastify.prisma.auditLog.create({
        data: {
          action: 'auth.refresh.replay_attack',
          entity: 'refresh_token',
          entityId: storedToken.id,
          userId: storedToken.userId,
          tenantId: storedToken.user.tenantId,
          details: { 
            tokenId: storedToken.id,
            usedAt: storedToken.usedAt,
            attemptedAt: new Date()
          },
        }
      });
      
      // Révoquer tous les refresh tokens de l'utilisateur par sécurité
      await this.fastify.prisma.refreshToken.deleteMany({
        where: { userId: storedToken.userId }
      });
      
      throw new Error('Token already used - security violation');
    }

    // Marquer le token comme utilisé (rotation)
    await this.fastify.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() }
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

  async logout(userId: string) {
    // Supprimer tous les refresh tokens de l'utilisateur
    await this.fastify.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Supprimer toutes les sessions
    await this.fastify.prisma.session.deleteMany({
      where: { userId },
    });
  }

  private async generateTokens(user: any) {
    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    };

    // Access token
    const accessToken = this.fastify.jwt.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    });

    // Refresh token
    const refreshToken = randomBytes(32).toString('hex');
    const refreshExpiresAt = new Date(
      Date.now() + this.parseExpiration(process.env.JWT_REFRESH_EXPIRATION || '7d')
    );

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

  private generateSubdomain(companyName: string): string {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  }

  private parseExpiration(exp: string): number {
    const match = exp.match(/^(\d+)([dhms])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // 7 jours par défaut

    const [, num, unit] = match;
    const value = parseInt(num!, 10);

    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      case 's': return value * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}