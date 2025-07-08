"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantId = getTenantId;
exports.createTenantFilter = createTenantFilter;
exports.addTenantToData = addTenantToData;
function getTenantId(request) {
    if (!request.tenantId) {
        throw new Error('Tenant ID not found in request');
    }
    return request.tenantId;
}
function createTenantFilter(tenantId) {
    return { tenantId };
}
function addTenantToData(data, tenantId) {
    return {
        ...data,
        tenantId,
    };
}
//# sourceMappingURL=tenant.js.map