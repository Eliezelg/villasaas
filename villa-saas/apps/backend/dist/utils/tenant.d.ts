import type { FastifyRequest } from 'fastify';
export declare function getTenantId(request: FastifyRequest): string;
export declare function createTenantFilter(tenantId: string): {
    tenantId: string;
};
export declare function addTenantToData<T extends Record<string, any>>(data: T, tenantId: string): T & {
    tenantId: string;
};
//# sourceMappingURL=tenant.d.ts.map