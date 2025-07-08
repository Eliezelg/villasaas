"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
async function healthRoutes(fastify) {
    fastify.get('/', async (_request, reply) => {
        const checks = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'unknown',
            redis: 'unknown',
        };
        try {
            // Check database
            await fastify.prisma.$queryRaw `SELECT 1`;
            checks.database = 'ok';
        }
        catch (error) {
            checks.database = 'error';
            checks.status = 'error';
        }
        try {
            // Check Redis
            await fastify.redis.ping();
            checks.redis = 'ok';
        }
        catch (error) {
            checks.redis = 'error';
            checks.status = 'error';
        }
        const statusCode = checks.status === 'ok' ? 200 : 503;
        reply.status(statusCode).send(checks);
    });
}
//# sourceMappingURL=health.routes.js.map