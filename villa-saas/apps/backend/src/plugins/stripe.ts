import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Stripe from 'stripe';

declare module 'fastify' {
  interface FastifyInstance {
    stripe: Stripe;
  }
}

async function stripePlugin(fastify: FastifyInstance) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY must be set');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
  });

  fastify.decorate('stripe', stripe);
  
  fastify.log.info('Stripe plugin loaded');
}

export default fp(stripePlugin, {
  name: 'stripe',
});