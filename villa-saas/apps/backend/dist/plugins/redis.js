"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const ioredis_1 = __importDefault(require("ioredis"));
async function redisPlugin(fastify) {
    const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
    });
    redis.on('error', (err) => {
        fastify.log.error(err, 'Redis connection error');
    });
    redis.on('connect', () => {
        fastify.log.info('Redis connected');
    });
    fastify.decorate('redis', redis);
    fastify.addHook('onClose', async (server) => {
        await server.redis.quit();
    });
}
exports.default = (0, fastify_plugin_1.default)(redisPlugin, {
    name: 'redis',
});
//# sourceMappingURL=redis.js.map