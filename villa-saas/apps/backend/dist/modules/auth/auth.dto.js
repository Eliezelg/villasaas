"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(100),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    companyName: zod_1.z.string().min(1).max(100),
    phone: zod_1.z.string().optional(),
    subdomain: zod_1.z.string()
        .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
        .max(63, 'Le sous-domaine ne peut pas dépasser 63 caractères')
        .regex(/^[a-z0-9-]+$/, 'Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets')
        .regex(/^[a-z0-9]/, 'Le sous-domaine doit commencer par une lettre ou un chiffre')
        .regex(/[a-z0-9]$/, 'Le sous-domaine doit finir par une lettre ou un chiffre')
        .optional(),
    domainOption: zod_1.z.enum(['subdomain', 'custom', 'existing']).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
//# sourceMappingURL=auth.dto.js.map