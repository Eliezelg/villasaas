"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const stripe_1 = __importDefault(require("stripe"));
async function stripePlugin(fastify) {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY must be set');
    }
    const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia',
        typescript: true,
    });
    fastify.decorate('stripe', stripe);
    fastify.log.info('Stripe plugin loaded');
}
exports.default = (0, fastify_plugin_1.default)(stripePlugin, {
    name: 'stripe',
});
//# sourceMappingURL=stripe.js.map