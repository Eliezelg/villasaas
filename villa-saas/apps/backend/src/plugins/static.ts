import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import path from 'path';
import fs from 'fs/promises';

const staticPlugin: FastifyPluginAsync = async (fastify) => {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  // Ensure uploads directory exists
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }

  // Serve static files from uploads directory
  fastify.get<{
    Params: { '*': string }
  }>('/uploads/*', async (request, reply) => {
    const filePath = request.params['*'];
    const fullPath = path.join(uploadsDir, filePath);

    try {
      // Security: Ensure the path doesn't escape the uploads directory
      const resolvedPath = path.resolve(fullPath);
      if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
        reply.status(403).send({ error: 'Forbidden' });
        return;
      }

      const file = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      reply
        .header('Content-Type', mimeType)
        .header('Cache-Control', 'public, max-age=31536000') // 1 year cache
        .header('Access-Control-Allow-Origin', '*')
        .header('Cross-Origin-Resource-Policy', 'cross-origin')
        .send(file);
    } catch (error) {
      reply.status(404).send({ error: 'File not found' });
    }
  });
};

export default fp(staticPlugin, {
  name: 'static',
});