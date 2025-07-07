import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Resend } from 'resend';

declare module 'fastify' {
  interface FastifyInstance {
    resend: Resend;
  }
}

const resendPlugin: FastifyPluginAsync = async (fastify) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    fastify.log.warn('RESEND_API_KEY not found in environment variables');
    // En développement, on peut continuer sans Resend
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is required in production');
    }
  }

  const resend = new Resend(resendApiKey || 'mock-key');
  
  fastify.decorate('resend', resend);
  
  fastify.log.info('Resend plugin registered');
};

export default fp(resendPlugin, {
  name: 'resend',
});