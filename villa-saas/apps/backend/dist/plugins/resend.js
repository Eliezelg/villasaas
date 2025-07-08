"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const resend_1 = require("resend");
const resendPlugin = async (fastify) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        fastify.log.warn('RESEND_API_KEY not found in environment variables');
        // En développement, on peut continuer sans Resend
        if (process.env.NODE_ENV === 'production') {
            throw new Error('RESEND_API_KEY is required in production');
        }
    }
    const resend = new resend_1.Resend(resendApiKey || 'mock-key');
    fastify.decorate('resend', resend);
    fastify.log.info('Resend plugin registered');
};
exports.default = (0, fastify_plugin_1.default)(resendPlugin, {
    name: 'resend',
});
//# sourceMappingURL=resend.js.map