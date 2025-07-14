import { PrismaClient } from '@prisma/client';
import { FastifyRequest } from 'fastify';

export type AuditAction = 
  // Auth events
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.login.blocked'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.password.change'
  | 'auth.password.reset'
  // Property events  
  | 'property.create'
  | 'property.update'
  | 'property.delete'
  | 'property.publish'
  | 'property.unpublish'
  // Booking events
  | 'booking.create'
  | 'booking.update'
  | 'booking.cancel'
  | 'booking.confirm'
  | 'booking.payment.success'
  | 'booking.payment.failed'
  // User events
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.role.change'
  // Tenant events
  | 'tenant.update'
  | 'tenant.settings.update'
  | 'tenant.billing.update'
  // Access events
  | 'access.denied'
  | 'permission.denied'
  | 'permissions.denied'
  // Data events
  | 'data.export'
  | 'data.import'
  | 'data.delete';

export interface AuditLogData {
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: any;
  userId?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Créer un log d'audit
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          details: data.details || {},
          userId: data.userId,
          tenantId: data.tenantId || 'system',
          ip: data.ip,
          userAgent: data.userAgent,
        }
      });
    } catch (error) {
      // Ne pas faire échouer l'opération principale si l'audit échoue
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Logger depuis une requête Fastify
   */
  async logFromRequest(
    request: FastifyRequest,
    action: AuditAction,
    entity: string,
    entityId?: string,
    details?: any
  ): Promise<void> {
    await this.log({
      action,
      entity,
      entityId,
      details,
      userId: request.user?.userId,
      tenantId: request.tenantId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  /**
   * Logger une opération réussie
   */
  async logSuccess(
    request: FastifyRequest,
    action: AuditAction,
    entity: string,
    entityId?: string,
    details?: any
  ): Promise<void> {
    await this.logFromRequest(request, action, entity, entityId, {
      ...details,
      status: 'success',
    });
  }

  /**
   * Logger une opération échouée
   */
  async logFailure(
    request: FastifyRequest,
    action: AuditAction,
    entity: string,
    error: string | Error,
    entityId?: string,
    details?: any
  ): Promise<void> {
    await this.logFromRequest(request, action, entity, entityId, {
      ...details,
      status: 'failure',
      error: error instanceof Error ? error.message : error,
    });
  }

  /**
   * Décorateur pour automatiquement logger les actions
   */
  static auditAction(action: AuditAction, entity: string) {
    return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const request = args[0] as FastifyRequest;
        const auditService = new AuditService(request.server.prisma);

        try {
          const result = await originalMethod.apply(this, args);
          
          // Logger le succès
          const entityId = result?.id || args[1]?.id;
          await auditService.logSuccess(request, action, entity, entityId, {
            method: propertyKey,
          });

          return result;
        } catch (error) {
          // Logger l'échec
          await auditService.logFailure(request, action, entity, error as Error, undefined, {
            method: propertyKey,
          });
          
          throw error;
        }
      };

      return descriptor;
    };
  }

  /**
   * Rechercher dans les logs d'audit
   */
  async search(filters: {
    tenantId?: string;
    userId?: string;
    action?: AuditAction;
    entity?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { logs, total };
  }

  /**
   * Nettoyer les anciens logs
   */
  async cleanup(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    return result.count;
  }
}