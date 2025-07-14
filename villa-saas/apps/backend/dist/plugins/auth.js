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
            // Vérifier d'abord le cookie, puis le header Authorization
            let token;
            // Essayer de récupérer le token depuis le cookie
            if (request.cookies && request.cookies.access_token) {
                token = request.cookies.access_token;
            }
            // Sinon, essayer depuis le header Authorization
            else if (request.headers.authorization) {
                const parts = request.headers.authorization.split(' ');
                if (parts.length === 2 && parts[0] === 'Bearer') {
                    token = parts[1];
                }
            }
            if (!token) {
                throw new Error('No token provided');
            }
            // Vérifier le token
            const decoded = await fastify.jwt.verify(token);
            request.user = decoded;
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
            let token;
            // Essayer de récupérer le token depuis le cookie
            if (request.cookies && request.cookies.access_token) {
                token = request.cookies.access_token;
            }
            // Sinon, essayer depuis le header Authorization
            else if (request.headers.authorization) {
                const parts = request.headers.authorization.split(' ');
                if (parts.length === 2 && parts[0] === 'Bearer') {
                    token = parts[1];
                }
            }
            if (token) {
                const decoded = await fastify.jwt.verify(token);
                request.user = decoded;
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