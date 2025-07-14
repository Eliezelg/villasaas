import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
export declare function getTestApp(): Promise<FastifyInstance>;
export declare function closeTestApp(): Promise<void>;
export declare function cleanDatabase(prisma: PrismaClient): Promise<void>;
export declare function createAuthHeader(token: string): {
    authorization: string;
};
export declare function createTenant(prisma: PrismaClient): Promise<{
    email: string;
    phone: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    name: string;
    companyName: string | null;
    siret: string | null;
    vatNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
    subdomain: string | null;
    customDomain: string | null;
    settings: import("@prisma/client/runtime/library").JsonValue;
    stripeAccountId: string | null;
    stripeAccountStatus: string | null;
    stripeDetailsSubmitted: boolean;
    stripeChargesEnabled: boolean;
    stripePayoutsEnabled: boolean;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    subscriptionPlan: string | null;
    subscriptionStatus: string | null;
    subscriptionEndDate: Date | null;
}>;
export declare function createUser(prisma: PrismaClient, tenantId: string): Promise<{
    email: string;
    firstName: string;
    lastName: string;
    role: import(".prisma/client").$Enums.UserRole;
    phone: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    passwordHash: string;
    isActive: boolean;
    emailVerified: boolean;
    tenantId: string;
    permissions: import("@prisma/client/runtime/library").JsonValue;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
}>;
export declare function generateToken(app: FastifyInstance, payload: {
    id: string;
    tenantId: string;
}): string;
//# sourceMappingURL=test-utils.d.ts.map