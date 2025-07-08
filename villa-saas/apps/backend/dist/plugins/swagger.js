"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
exports.default = (0, fastify_plugin_1.default)(async (fastify) => {
    await fastify.register(swagger_1.default, {
        openapi: {
            info: {
                title: 'Villa SaaS API',
                description: 'API pour la plateforme de gestion de locations de vacances Villa SaaS',
                version: '1.0.0',
            },
            servers: [
                {
                    url: process.env.API_URL || 'http://localhost:3001',
                    description: 'Serveur de développement',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
                schemas: {
                    Error: {
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                            message: { type: 'string' },
                            statusCode: { type: 'number' },
                        },
                    },
                    Tenant: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            domain: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                            settings: { type: 'object' },
                        },
                    },
                    User: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            role: { type: 'string', enum: ['ADMIN', 'OWNER', 'MANAGER', 'VIEWER'] },
                            isActive: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Property: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            slug: { type: 'string' },
                            propertyType: {
                                type: 'string',
                                enum: ['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LOFT', 'CHALET', 'BUNGALOW', 'MOBILE_HOME', 'BOAT', 'OTHER']
                            },
                            status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
                            address: { type: 'string' },
                            city: { type: 'string' },
                            postalCode: { type: 'string' },
                            country: { type: 'string' },
                            latitude: { type: 'number' },
                            longitude: { type: 'number' },
                            bedrooms: { type: 'integer' },
                            bathrooms: { type: 'integer' },
                            maxGuests: { type: 'integer' },
                            surfaceArea: { type: 'number' },
                            description: { type: 'object' },
                            basePrice: { type: 'number' },
                            weekendPremium: { type: 'number' },
                            cleaningFee: { type: 'number' },
                            securityDeposit: { type: 'number' },
                            minNights: { type: 'integer' },
                            checkInTime: { type: 'string' },
                            checkOutTime: { type: 'string' },
                            instantBooking: { type: 'boolean' },
                            amenities: { type: 'object' },
                            atmosphere: { type: 'object' },
                            images: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/PropertyImage' }
                            },
                            _count: {
                                type: 'object',
                                properties: {
                                    bookings: { type: 'integer' },
                                    images: { type: 'integer' },
                                },
                            },
                        },
                    },
                    PropertyImage: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            propertyId: { type: 'string' },
                            url: { type: 'string' },
                            urls: { type: 'object' },
                            alt: { type: 'string' },
                            caption: { type: 'object' },
                            order: { type: 'integer' },
                            isPrimary: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Period: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            tenantId: { type: 'string' },
                            propertyId: { type: 'string', nullable: true },
                            name: { type: 'string' },
                            startDate: { type: 'string', format: 'date-time' },
                            endDate: { type: 'string', format: 'date-time' },
                            priority: { type: 'integer' },
                            basePrice: { type: 'number' },
                            weekendPremium: { type: 'number' },
                            minNights: { type: 'integer' },
                            isActive: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    PricingDetails: {
                        type: 'object',
                        properties: {
                            nights: { type: 'integer' },
                            basePrice: { type: 'number' },
                            totalAccommodation: { type: 'number' },
                            weekendPremium: { type: 'number' },
                            seasonalAdjustment: { type: 'number' },
                            longStayDiscount: { type: 'number' },
                            cleaningFee: { type: 'number' },
                            touristTax: { type: 'number' },
                            subtotal: { type: 'number' },
                            total: { type: 'number' },
                            averagePricePerNight: { type: 'number' },
                            breakdown: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        date: { type: 'string', format: 'date' },
                                        basePrice: { type: 'number' },
                                        weekendPremium: { type: 'number' },
                                        finalPrice: { type: 'number' },
                                        periodName: { type: 'string', nullable: true },
                                    },
                                },
                            },
                        },
                    },
                    LoginRequest: {
                        type: 'object',
                        required: ['email', 'password'],
                        properties: {
                            email: { type: 'string', format: 'email' },
                            password: { type: 'string', minLength: 8 },
                        },
                    },
                    RegisterRequest: {
                        type: 'object',
                        required: ['email', 'password', 'firstName', 'lastName', 'tenantName'],
                        properties: {
                            email: { type: 'string', format: 'email' },
                            password: { type: 'string', minLength: 8 },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            tenantName: { type: 'string' },
                            domain: { type: 'string' },
                        },
                    },
                    AuthResponse: {
                        type: 'object',
                        properties: {
                            user: { $ref: '#/components/schemas/User' },
                            tenant: { $ref: '#/components/schemas/Tenant' },
                            accessToken: { type: 'string' },
                            refreshToken: { type: 'string' },
                        },
                    },
                },
            },
            tags: [
                { name: 'Health', description: 'Endpoints de santé' },
                { name: 'Auth', description: 'Authentification et gestion des sessions' },
                { name: 'Tenants', description: 'Gestion des organisations' },
                { name: 'Users', description: 'Gestion des utilisateurs' },
                { name: 'Properties', description: 'Gestion des propriétés' },
                { name: 'Property Images', description: 'Gestion des images de propriétés' },
                { name: 'Periods', description: 'Gestion des périodes tarifaires' },
                { name: 'Pricing', description: 'Calcul des prix et disponibilités' },
            ],
        },
    });
    await fastify.register(swagger_ui_1.default, {
        routePrefix: '/documentation',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
        transformSpecification: (swaggerObject) => {
            return swaggerObject;
        },
        transformSpecificationClone: true,
    });
});
//# sourceMappingURL=swagger.js.map