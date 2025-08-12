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
const cookie_1 = __importDefault(require("@fastify/cookie"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const fastify_raw_body_1 = __importDefault(require("fastify-raw-body"));
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
const vercel_1 = __importDefault(require("./plugins/vercel"));
const cloudflare_1 = __importDefault(require("./plugins/cloudflare"));
const health_routes_1 = require("./modules/health/health.routes");
const auth_routes_1 = require("./modules/auth/auth.routes");
const auth_signup_routes_1 = require("./modules/auth/auth-signup.routes");
const signup_session_routes_1 = require("./modules/auth/signup-session.routes");
const tenants_routes_1 = require("./modules/tenants/tenants.routes");
const users_routes_1 = require("./modules/users/users.routes");
const properties_routes_1 = require("./modules/properties/properties.routes");
// import { propertyImageRoutes } from './modules/properties/images.routes';
const images_s3_routes_1 = require("./modules/properties/images-s3.routes");
const property_quota_routes_1 = require("./modules/properties/property-quota.routes");
const periods_routes_1 = require("./modules/periods/periods.routes");
const pricing_routes_1 = require("./modules/pricing/pricing.routes");
const availability_routes_1 = __importDefault(require("./modules/availability/availability.routes"));
const booking_routes_1 = require("./modules/bookings/booking.routes");
const analytics_routes_1 = require("./modules/analytics/analytics.routes");
const public_routes_1 = require("./modules/public/public.routes");
const payments_routes_1 = require("./modules/payments/payments.routes");
const subscriptions_routes_1 = require("./modules/subscriptions/subscriptions.routes");
const promocodes_routes_1 = require("./modules/promocodes/promocodes.routes");
const promocodes_public_routes_1 = require("./modules/public/promocodes.public.routes");
const messaging_routes_1 = require("./modules/messaging/messaging.routes");
const auto_response_routes_1 = require("./modules/messaging/auto-response.routes");
const booking_options_routes_1 = require("./modules/booking-options/booking-options.routes");
const domains_routes_1 = require("./modules/domains/domains.routes");
const dns_management_routes_1 = require("./modules/domains/dns-management.routes");
const domain_lookup_routes_1 = require("./modules/public/domain-lookup.routes");
const public_site_routes_1 = require("./modules/public-site/public-site.routes");
const subdomain_check_routes_1 = require("./modules/public/subdomain-check.routes");
async function buildApp(opts = {}) {
    const app = (0, fastify_1.default)(opts);
    // Global error handler
    app.setErrorHandler(error_handler_1.errorHandler);
    // Handle OPTIONS requests early to avoid CORS preflight issues
    app.addHook('onRequest', async (request, reply) => {
        if (request.method === 'OPTIONS') {
            reply
                .code(204)
                .header('Access-Control-Allow-Origin', request.headers.origin || '*')
                .header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant')
                .header('Access-Control-Allow-Credentials', 'true')
                .send();
        }
    });
    // Core plugins
    await app.register(cors_1.default, {
        origin: (origin, cb) => {
            // Configuration pour le développement
            const devOrigins = [
                'http://localhost:3000',
                'http://localhost:3002',
                /^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/, // Sous-domaines de localhost:3000 (app unifiée)
                /^http:\/\/[a-zA-Z0-9-]+\.localhost:3002$/, // Sous-domaines de localhost:3002
                /^http:\/\/localhost:\d+$/, // N'importe quel port localhost
            ];
            // Configuration pour la production
            const prodOrigins = process.env.NODE_ENV === 'production' ? [
                process.env.FRONTEND_URL,
                ...(process.env.ALLOWED_BOOKING_DOMAINS?.split(',') || []),
                // Ajouter explicitement les domaines Vercel
                'https://villasaas-eight.vercel.app',
                'https://villasaas-a4wtdk312-villa-saas.vercel.app',
                /^https:\/\/villasaas.*\.vercel\.app$/,
                // Ajouter le domaine webpro200.fr et ses sous-domaines
                'https://webpro200.fr',
                'https://www.webpro200.fr',
                'https://aviv.webpro200.fr', // Ajouter explicitement aviv pour le test
                /^https:\/\/[a-zA-Z0-9-]+\.webpro200\.fr$/, // Pattern pour tous les sous-domaines
                // Force deployment: 2025-08-12T10:57:00Z - CORS fix for PATCH method
            ].filter(Boolean) : [];
            const allowedOrigins = [...devOrigins, ...prodOrigins];
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
                app.log.warn(`CORS blocked origin: ${origin}`);
                cb(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant'],
        exposedHeaders: ['X-Total-Count'],
    });
    await app.register(helmet_1.default, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://js.stripe.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                imgSrc: ["'self'", "data:", "https:", "blob:", process.env.AWS_CDN_DOMAIN || ""].filter(Boolean),
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                connectSrc: ["'self'", "https://api.stripe.com", "wss:", process.env.FRONTEND_URL || ""].filter(Boolean),
                frameAncestors: ["'none'"],
                frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        originAgentCluster: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        permittedCrossDomainPolicies: false,
        dnsPrefetchControl: true,
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
        ieNoOpen: true,
        noSniff: true,
        xssFilter: true
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
    await app.register(cookie_1.default, {
        secret: process.env.COOKIE_SECRET || process.env.SESSION_SECRET, // pour signer les cookies
        parseOptions: {}
    });
    await app.register(multipart_1.default, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
            files: 10, // Max 10 files per request
        },
    });
    // Register raw body plugin for Stripe webhooks
    await app.register(fastify_raw_body_1.default, {
        field: 'rawBody',
        global: false,
        encoding: 'utf8',
        runFirst: true,
        routes: ['/api/public/stripe/webhook', '/api/public/stripe/subscription-webhook']
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
    await app.register(vercel_1.default);
    await app.register(cloudflare_1.default);
    // Routes
    await app.register(health_routes_1.healthRoutes, { prefix: '/health' });
    await app.register(auth_routes_1.authRoutes, { prefix: '/api/auth' });
    await app.register(auth_signup_routes_1.authSignupRoutes, { prefix: '/api' });
    await app.register(signup_session_routes_1.signupSessionRoutes, { prefix: '/api' });
    await app.register(tenants_routes_1.tenantRoutes, { prefix: '/api/tenants' });
    await app.register(users_routes_1.userRoutes, { prefix: '/api/users' });
    await app.register(properties_routes_1.propertyRoutes, { prefix: '/api/properties' });
    // await app.register(propertyImageRoutes, { prefix: '/api/properties' }); // Old local storage
    await app.register(images_s3_routes_1.propertyImageS3Routes, { prefix: '/api/properties' }); // New S3 storage
    await app.register(property_quota_routes_1.propertyQuotaRoutes, { prefix: '/api' });
    await app.register(periods_routes_1.periodRoutes, { prefix: '/api/periods' });
    await app.register(pricing_routes_1.pricingRoutes, { prefix: '/api/pricing' });
    await app.register(availability_routes_1.default, { prefix: '/api/availability' });
    await app.register(booking_routes_1.bookingRoutes, { prefix: '/api' });
    await app.register(analytics_routes_1.analyticsRoutes, { prefix: '/api/analytics' });
    await app.register(payments_routes_1.paymentsRoutes, { prefix: '/api' });
    await app.register(subscriptions_routes_1.subscriptionsRoutes, { prefix: '/api' });
    await app.register(promocodes_routes_1.promocodesRoutes, { prefix: '/api' });
    await app.register(messaging_routes_1.messagingRoutes, { prefix: '/api/messaging' });
    await app.register(auto_response_routes_1.autoResponseRoutes, { prefix: '/api/messaging' });
    await app.register(booking_options_routes_1.bookingOptionsRoutes, { prefix: '/api' });
    await app.register(public_site_routes_1.publicSiteRoutes, { prefix: '/api' });
    await app.register(domains_routes_1.domainsRoutes);
    await app.register(dns_management_routes_1.dnsManagementRoutes, { prefix: '/api' });
    // Public routes (no auth required)
    await app.register(public_routes_1.publicRoutes, { prefix: '/api' });
    await app.register(promocodes_public_routes_1.publicPromoCodesRoutes, { prefix: '/api' });
    await app.register(domain_lookup_routes_1.domainLookupRoutes);
    await app.register(subdomain_check_routes_1.subdomainCheckRoutes, { prefix: '/api' });
    return app;
}
//# sourceMappingURL=app.js.map