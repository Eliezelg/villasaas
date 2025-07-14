import type { FastifyRequest } from 'fastify';

interface RequestWithTenant extends FastifyRequest {
  tenantId?: string;
}

export function getTenantId(request: RequestWithTenant): string {
  if (!request.tenantId) {
    throw new Error('Tenant ID not found in request');
  }
  return request.tenantId;
}

export function createTenantFilter(tenantId: string) {
  return { tenantId };
}

export function addTenantToData<T extends Record<string, any>>(
  data: T,
  tenantId: string
): T & { tenantId: string } {
  return {
    ...data,
    tenantId,
  };
}