import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { getCloudflareService } from '../services/cloudflare.service';

async function cloudflarePlugin(fastify: FastifyInstance): Promise<void> {
  try {
    // Vérifier si les variables d'environnement sont configurées
    if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ZONE_ID) {
      fastify.log.warn('Cloudflare API not configured. Automatic DNS management will be disabled.');
      return;
    }

    const cloudflareService = getCloudflareService();
    
    // Décorer l'instance Fastify avec le service Cloudflare
    fastify.decorate('cloudflare', cloudflareService);
    
    fastify.log.info('Cloudflare plugin loaded');
  } catch (error) {
    fastify.log.error('Failed to initialize Cloudflare plugin:', error);
    // Ne pas faire crasher l'app si Cloudflare n'est pas configuré
  }
}

export default fp(cloudflarePlugin, {
  name: 'cloudflare',
});

// Augmenter les types TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    cloudflare?: ReturnType<typeof getCloudflareService>;
  }
}