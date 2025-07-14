"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const client_1 = require("@prisma/client");
async function prismaPlugin(fastify) {
    const prisma = new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
    });
    // Middleware pour le multi-tenancy automatique
    prisma.$use(async (params, next) => {
        // Ne pas appliquer sur les modèles qui n'ont pas de tenantId
        const modelsWithoutTenant = ['RefreshToken', 'Session'];
        if (params.model && !modelsWithoutTenant.includes(params.model)) {
            // Pour les opérations de lecture
            if (params.action === 'findUnique' || params.action === 'findFirst') {
                if (params.args.where && params.args.where.tenantId === undefined) {
                    // Le tenantId sera ajouté par le code appelant
                }
            }
            else if (params.action === 'findMany') {
                if (!params.args)
                    params.args = {};
                if (!params.args.where)
                    params.args.where = {};
                // Le tenantId sera ajouté par le code appelant
            }
            // Pour les opérations de création
            if (params.action === 'create') {
                if (!params.args.data.tenantId) {
                    // Le tenantId sera ajouté par le code appelant
                }
            }
        }
        return next(params);
    });
    await prisma.$connect();
    fastify.decorate('prisma', prisma);
    fastify.addHook('onClose', async (server) => {
        await server.prisma.$disconnect();
    });
}
exports.default = (0, fastify_plugin_1.default)(prismaPlugin, {
    name: 'prisma',
});
//# sourceMappingURL=prisma.js.map