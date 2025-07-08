"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const error_handler_1 = require("./utils/error-handler");
const auth_1 = __importDefault(require("./plugins/auth"));
const prisma_1 = __importDefault(require("./plugins/prisma"));
const redis_1 = __importDefault(require("./plugins/redis"));
const static_1 = __importDefault(require("./plugins/static"));
const swagger_1 = __importDefault(require("./plugins/swagger"));
const stripe_1 = __importDefault(require("./plugins/stripe"));
const s3_1 = __importDefault(require("./plugins/s3"));
const resend_1 = __importDefault(require("./plugins/resend"));
const websocket_1 = __importDefault(require("./plugins/websocket"));
const health_routes_1 = require("./modules/health/health.routes");
const auth_routes_1 = require("./modules/auth/auth.routes");
const tenants_routes_1 = require("./modules/tenants/tenants.routes");
const users_routes_1 = require("./modules/users/users.routes");
const properties_routes_1 = require("./modules/properties/properties.routes");
const images_s3_routes_1 = require("./modules/properties/images-s3.routes");
const periods_routes_1 = require("./modules/periods/periods.routes");
const pricing_routes_1 = require("./modules/pricing/pricing.routes");
const availability_routes_1 = __importDefault(require("./modules/availability/availability.routes"));
const booking_routes_1 = require("./modules/bookings/booking.routes");
const analytics_routes_1 = require("./modules/analytics/analytics.routes");
const public_routes_1 = require("./modules/public/public.routes");
const payments_routes_1 = require("./modules/payments/payments.routes");
const promocodes_routes_1 = require("./modules/promocodes/promocodes.routes");
const promocodes_public_routes_1 = require("./modules/public/promocodes.public.routes");
const messaging_routes_1 = require("./modules/messaging/messaging.routes");
const auto_response_routes_1 = require("./modules/messaging/auto-response.routes");
async function buildApp(opts = {}) {
    const app = (0, fastify_1.default)(opts);
    // Global error handler
    app.setErrorHandler(error_handler_1.errorHandler);
    // Core plugins
    await app.register(cors_1.default, {
        origin: (origin, cb) => {
            // Permettre les requêtes depuis localhost avec n'importe quel port et sous-domaine
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3002',
                /^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/, // Sous-domaines de localhost:3000 (app unifiée)
                /^http:\/\/[a-zA-Z0-9-]+\.localhost:3002$/, // Sous-domaines de localhost:3002
                /^http:\/\/localhost:\d+$/, // N'importe quel port localhost
            ];
            // Si pas d'origine (ex: Postman), permettre
            if (!origin) {
                cb(null, true);
                return;
            }
            // Vérifier si l'origine est autorisée
            const isAllowed = allowedOrigins.some(allowed => {
                if (allowed instanceof RegExp) {
                    return allowed.test(origin);
                }
                return allowed === origin;
            });
            if (isAllowed) {
                cb(null, true);
            }
            else {
                cb(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    });
    await app.register(helmet_1.default, {
        contentSecurityPolicy: false,
    });
    await app.register(rate_limit_1.default, {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    });
    await app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET,
        sign: {
            expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
        },
    });
    await app.register(multipart_1.default, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
            files: 10, // Max 10 files per request
        },
    });
    // Register Swagger before routes
    await app.register(swagger_1.default);
    // Custom plugins
    await app.register(prisma_1.default);
    await app.register(redis_1.default);
    await app.register(s3_1.default);
    await app.register(stripe_1.default);
    await app.register(resend_1.default);
    await app.register(auth_1.default);
    await app.register(static_1.default);
    await app.register(websocket_1.default);
    // Routes
    await app.register(health_routes_1.healthRoutes, { prefix: '/health' });
    await app.register(auth_routes_1.authRoutes, { prefix: '/api/auth' });
    await app.register(tenants_routes_1.tenantRoutes, { prefix: '/api/tenants' });
    await app.register(users_routes_1.userRoutes, { prefix: '/api/users' });
    await app.register(properties_routes_1.propertyRoutes, { prefix: '/api/properties' });
    // await app.register(propertyImageRoutes, { prefix: '/api/properties' }); // Old local storage
    await app.register(images_s3_routes_1.propertyImageS3Routes, { prefix: '/api/properties' }); // New S3 storage
    await app.register(periods_routes_1.periodRoutes, { prefix: '/api/periods' });
    await app.register(pricing_routes_1.pricingRoutes, { prefix: '/api/pricing' });
    await app.register(availability_routes_1.default, { prefix: '/api/availability' });
    await app.register(booking_routes_1.bookingRoutes, { prefix: '/api' });
    await app.register(analytics_routes_1.analyticsRoutes, { prefix: '/api/analytics' });
    await app.register(payments_routes_1.paymentsRoutes, { prefix: '/api' });
    await app.register(promocodes_routes_1.promocodesRoutes, { prefix: '/api' });
    await app.register(messaging_routes_1.messagingRoutes, { prefix: '/api/messaging' });
    await app.register(auto_response_routes_1.autoResponseRoutes, { prefix: '/api/messaging/auto-response' });
    // Public routes (no auth required)
    await app.register(public_routes_1.publicRoutes, { prefix: '/api' });
    await app.register(promocodes_public_routes_1.publicPromoCodesRoutes, { prefix: '/api' });
    return app;
}
//# sourceMappingURL=app.js.map