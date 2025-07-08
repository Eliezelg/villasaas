"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
async function authPlugin(fastify) {
    // Décorateur pour l'authentification obligatoire
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify();
            // Ajouter le tenantId à la requête pour faciliter l'accès
            request.tenantId = request.user.tenantId;
        }
        catch (err) {
            reply.code(401).send({ error: 'Unauthorized' });
        }
    });
    // Décorateur pour l'authentification optionnelle
    fastify.decorate('authenticateOptional', async function (request, _reply) {
        try {
            if (request.headers.authorization) {
                await request.jwtVerify();
                request.tenantId = request.user.tenantId;
            }
        }
        catch (err) {
            // Ignorer les erreurs, l'authentification est optionnelle
        }
    });
}
exports.default = (0, fastify_plugin_1.default)(authPlugin, {
    name: 'auth',
});
//# sourceMappingURL=auth.js.map