import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
export declare function getTestApp(): Promise<FastifyInstance>;
export declare function closeTestApp(): Promise<void>;
export declare function cleanDatabase(prisma: PrismaClient): Promise<void>;
export declare function createAuthHeader(token: string): {
    authorization: string;
};
export declare function createTenant(prisma: PrismaClient): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    phone: string | null;
    isActive: boolean;
    subdomain: string | null;
    companyName: string | null;
    siret: string | null;
    vatNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
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
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    id: string;
    createdAt: Date;
    role: import(".prisma/client").$Enums.UserRole;
    updatedAt: Date;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    isActive: boolean;
    emailVerified: boolean;
    tenantId: string;
    permissions: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function generateToken(app: FastifyInstance, payload: {
    id: string;
    tenantId: string;
}): string;
//# sourceMappingURL=test-utils.d.ts.map