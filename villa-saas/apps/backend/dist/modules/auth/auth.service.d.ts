import type { FastifyInstance } from 'fastify';
import type { RegisterDto, LoginDto } from './auth.dto';
export declare class AuthService {
    private fastify;
    constructor(fastify: FastifyInstance);
    register(data: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        tenant: {
            id: string;
            name: string;
            subdomain: string | null;
        };
    }>;
    login(data: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        tenant: {
            id: string;
            name: string;
            subdomain: string | null;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    logout(userId: string): Promise<void>;
    private generateTokens;
    private generateSubdomain;
    private parseExpiration;
}
//# sourceMappingURL=auth.service.d.ts.map