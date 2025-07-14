import { FastifyRequest, FastifyReply } from 'fastify';

export type Permission = 
  | 'properties.read'
  | 'properties.write'
  | 'properties.delete'
  | 'bookings.read'
  | 'bookings.write'
  | 'bookings.delete'
  | 'users.read'
  | 'users.write'
  | 'users.delete'
  | 'tenant.read'
  | 'tenant.write'
  | 'analytics.read'
  | 'payments.read'
  | 'payments.write'
  | 'settings.read'
  | 'settings.write';

// Définir les permissions par rôle
const rolePermissions: Record<string, Permission[]> = {
  OWNER: [
    // Les propriétaires ont toutes les permissions
    'properties.read', 'properties.write', 'properties.delete',
    'bookings.read', 'bookings.write', 'bookings.delete',
    'users.read', 'users.write', 'users.delete',
    'tenant.read', 'tenant.write',
    'analytics.read',
    'payments.read', 'payments.write',
    'settings.read', 'settings.write'
  ],
  ADMIN: [
    // Les admins peuvent tout faire sauf gérer le tenant et les paiements
    'properties.read', 'properties.write', 'properties.delete',
    'bookings.read', 'bookings.write', 'bookings.delete',
    'users.read', 'users.write',
    'tenant.read',
    'analytics.read',
    'payments.read',
    'settings.read', 'settings.write'
  ],
  USER: [
    // Les utilisateurs standards ont des permissions limitées
    'properties.read',
    'bookings.read',
    'tenant.read',
    'analytics.read'
  ]
};

/**
 * Middleware pour vérifier les rôles
 */
export function requireRole(allowedRoles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const userRole = request.user.role as string;
    
    if (!allowedRoles.includes(userRole)) {
      // Log de sécurité
      await request.server.prisma.auditLog.create({
        data: {
          tenantId: request.tenantId!,
          userId: request.user?.userId || null,
          action: 'access.denied',
          entity: 'rbac',
          details: {
            requiredRoles: allowedRoles,
            userRole,
            path: request.url,
            method: request.method
          },
          ip: request.ip
        }
      });

      return reply.code(403).send({ 
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }
  };
}

/**
 * Middleware pour vérifier les permissions spécifiques
 */
export function requirePermission(requiredPermission: Permission) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const userRole = request.user.role as string;
    const userPermissions = rolePermissions[userRole] || [];
    
    if (!userPermissions.includes(requiredPermission)) {
      // Log de sécurité
      await request.server.prisma.auditLog.create({
        data: {
          tenantId: request.tenantId!,
          userId: request.user?.userId || null,
          action: 'permission.denied',
          entity: 'rbac',
          details: {
            requiredPermission,
            userRole,
            userPermissions,
            path: request.url,
            method: request.method
          },
          ip: request.ip
        }
      });

      return reply.code(403).send({ 
        error: 'Forbidden',
        message: `Missing required permission: ${requiredPermission}`
      });
    }
  };
}

/**
 * Middleware pour vérifier plusieurs permissions (l'utilisateur doit avoir toutes les permissions)
 */
export function requireAllPermissions(requiredPermissions: Permission[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const userRole = request.user.role as string;
    const userPermissions = rolePermissions[userRole] || [];
    
    const missingPermissions = requiredPermissions.filter(
      permission => !userPermissions.includes(permission)
    );
    
    if (missingPermissions.length > 0) {
      // Log de sécurité
      await request.server.prisma.auditLog.create({
        data: {
          tenantId: request.tenantId!,
          userId: request.user?.userId || null,
          action: 'permissions.denied',
          entity: 'rbac',
          details: {
            requiredPermissions,
            missingPermissions,
            userRole,
            path: request.url,
            method: request.method
          },
          ip: request.ip
        }
      });

      return reply.code(403).send({ 
        error: 'Forbidden',
        message: `Missing required permissions: ${missingPermissions.join(', ')}`
      });
    }
  };
}

/**
 * Middleware pour vérifier au moins une permission (l'utilisateur doit avoir au moins une des permissions)
 */
export function requireAnyPermission(requiredPermissions: Permission[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const userRole = request.user.role as string;
    const userPermissions = rolePermissions[userRole] || [];
    
    const hasAnyPermission = requiredPermissions.some(
      permission => userPermissions.includes(permission)
    );
    
    if (!hasAnyPermission) {
      // Log de sécurité
      await request.server.prisma.auditLog.create({
        data: {
          tenantId: request.tenantId!,
          userId: request.user?.userId || null,
          action: 'permissions.denied',
          entity: 'rbac',
          details: {
            requiredPermissions,
            userRole,
            userPermissions,
            path: request.url,
            method: request.method
          },
          ip: request.ip
        }
      });

      return reply.code(403).send({ 
        error: 'Forbidden',
        message: `Missing any of required permissions: ${requiredPermissions.join(', ')}`
      });
    }
  };
}

/**
 * Vérifier si un utilisateur a une permission spécifique
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Obtenir toutes les permissions d'un rôle
 */
export function getRolePermissions(role: string): Permission[] {
  return rolePermissions[role] || [];
}