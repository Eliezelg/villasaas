import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    companyName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    subdomain: z.ZodOptional<z.ZodString>;
    domainOption: z.ZodOptional<z.ZodEnum<["subdomain", "custom", "existing"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    companyName: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string | undefined;
    subdomain?: string | undefined;
    domainOption?: "subdomain" | "custom" | "existing" | undefined;
}, {
    email: string;
    companyName: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string | undefined;
    subdomain?: string | undefined;
    domainOption?: "subdomain" | "custom" | "existing" | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
//# sourceMappingURL=auth.dto.d.ts.map