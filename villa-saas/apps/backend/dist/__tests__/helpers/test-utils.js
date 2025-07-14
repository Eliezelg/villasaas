"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestApp = getTestApp;
exports.closeTestApp = closeTestApp;
exports.cleanDatabase = cleanDatabase;
exports.createAuthHeader = createAuthHeader;
exports.createTenant = createTenant;
exports.createUser = createUser;
exports.generateToken = generateToken;
const app_1 = require("../../app");
let app = null;
async function getTestApp() {
    if (!app) {
        app = await (0, app_1.buildApp)({
            logger: false,
        });
    }
    return app;
}
async function closeTestApp() {
    if (app) {
        await app.close();
        app = null;
    }
}
async function cleanDatabase(prisma) {
    const tables = [
        'auditLog',
        'searchQuery',
        'integration',
        'emailTemplate',
        'review',
        'touristTax',
        'blockedPeriod',
        'payment',
        'booking',
        'period',
        'propertyImage',
        'property',
        'session',
        'refreshToken',
        'user',
        'tenant',
    ];
    for (const table of tables) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    }
}
function createAuthHeader(token) {
    return { authorization: `Bearer ${token}` };
}
async function createTenant(prisma) {
    return prisma.tenant.create({
        data: {
            name: 'Test Tenant',
            email: 'test@example.com',
            phone: '+33123456789',
            companyName: 'Test Company',
            subdomain: 'test',
            isActive: true
        }
    });
}
async function createUser(prisma, tenantId) {
    return prisma.user.create({
        data: {
            tenantId,
            email: 'user@example.com',
            passwordHash: '$2a$10$K7L1OJ0/Az9H5f/bVqHDsOZZKBgfGVmGe4dB0V1u.GYKqwL1J1Jyu', // password
            firstName: 'Test',
            lastName: 'User',
            role: 'ADMIN',
            isActive: true,
            emailVerified: true
        }
    });
}
function generateToken(app, payload) {
    return app.jwt.sign({
        userId: payload.id,
        tenantId: payload.tenantId,
        email: 'test@example.com',
        role: 'OWNER'
    });
}
//# sourceMappingURL=test-utils.js.map