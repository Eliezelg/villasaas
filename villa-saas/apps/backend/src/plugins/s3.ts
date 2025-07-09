import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { S3Client } from '@aws-sdk/client-s3';

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Client;
  }
}

async function s3Plugin(fastify: FastifyInstance) {
  const s3Config = {
    region: process.env.AWS_REGION || 'eu-central-1',
    endpoint: process.env.AWS_S3_ENDPOINT, // Support pour Cloudflare R2
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
  };

  const s3 = new S3Client(s3Config);

  fastify.decorate('s3', s3);
  
  fastify.log.info('S3 plugin loaded');
}

export default fp(s3Plugin, {
  name: 's3',
});