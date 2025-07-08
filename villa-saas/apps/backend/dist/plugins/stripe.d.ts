import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
declare module 'fastify' {
    interface FastifyInstance {
        stripe: Stripe;
    }
}
declare function stripePlugin(fastify: FastifyInstance): Promise<void>;
declare const _default: typeof stripePlugin;
export default _default;
//# sourceMappingURL=stripe.d.ts.map