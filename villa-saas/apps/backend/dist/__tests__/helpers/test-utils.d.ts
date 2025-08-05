import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
export declare function getTestApp(): Promise<FastifyInstance>;
export declare function closeTestApp(): Promise<void>;
export declare function cleanDatabase(prisma: PrismaClient): Promise<void>;
export declare function createAuthHeader(token: string): {
    authorization: string;
};
export declare function createTenant(prisma: PrismaClient): Promise<{
    subdomain: string | null;
    email: string;
    settings: import("@prisma/client/runtime/library").JsonValue;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    phone: string | null;
    companyName: string | null;
    siret: string | null;
    vatNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
    customDomain: string | null;
    isActive: boolean;
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
    id: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string | null;
    isActive: boolean;
    tenantId: string;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    firstName: string;
    lastName: string;
    passwordHash: string;
    emailVerified: boolean;
    role: import(".prisma/client").$Enums.UserRole;
    permissions: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function generateToken(app: FastifyInstance, payload: {
    id: string;
    tenantId: string;
}): string;
//# sourceMappingURL=test-utils.d.ts.map