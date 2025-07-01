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

  async login(data: LoginDto) {
    const { email, password } = data;

    // Trouver l'utilisateur avec son tenant
    const user = await this.fastify.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Vérifier que le compte est actif
    if (!user.isActive || !user.tenant.isActive) {
      throw new Error('Account is disabled');
    }

    // Générer les tokens
    const tokens = await this.generateTokens(user);

    // Créer une session
    await this.fastify.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
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
      throw new Error('Invalid refresh token');
    }

    // Supprimer l'ancien refresh token
    await this.fastify.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Générer de nouveaux tokens
    const tokens = await this.generateTokens(storedToken.user);

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