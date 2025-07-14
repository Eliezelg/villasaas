import type { FastifyInstance } from 'fastify';
import axios from 'axios';

export async function imageProxyRoutes(fastify: FastifyInstance): Promise<void> {
  // Proxy images from R2
  fastify.get('/images/proxy/*', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
  }, async (request, reply) => {
    const path = (request.params as any)['*'];
    const r2Domain = process.env.AWS_CDN_DOMAIN || 'https://pub-85fe05f2657948159cf737500dd6f474.r2.dev';
    const imageUrl = `${r2Domain}/${path}`;
    
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'stream',
        headers: {
          'User-Agent': 'Villa-SaaS-Backend/1.0',
        },
      });
      
      // Forward headers
      reply.header('Content-Type', response.headers['content-type']);
      reply.header('Content-Length', response.headers['content-length']);
      reply.header('Cache-Control', 'public, max-age=31536000');
      reply.header('Access-Control-Allow-Origin', '*');
      
      // Stream the response
      return reply.send(response.data);
    } catch (error: any) {
      fastify.log.error({ error: error.message, imageUrl }, 'Failed to proxy image');
      return reply.code(404).send({ error: 'Image not found' });
    }
  });
}