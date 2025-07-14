import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { getTenantId } from '@villa-saas/utils';
import { optimizeImage, deleteImageVariants } from '../../utils/image-optimizer';
import { validateFileUpload, sanitizeFilename, generateSecureFilename } from '../../utils/file-validator';

const uploadDir = path.join(process.cwd(), 'uploads', 'properties');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

const updateImageOrderSchema = z.object({
  images: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0),
  })),
});

export async function propertyImageRoutes(fastify: FastifyInstance): Promise<void> {
  // Upload images for a property
  fastify.post('/:propertyId/images', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          propertyId: { type: 'string' },
        },
        required: ['propertyId'],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { propertyId } = request.params as { propertyId: string };

    // Verify property belongs to tenant
    const property = await fastify.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
      },
    });

    if (!property) {
      reply.status(404).send({ error: 'Property not found' });
      return;
    }

    await ensureUploadDir();

    // For now, we'll use base64 upload from the request body
    const { image, filename } = request.body as { image: string; filename: string };
    
    if (!image || !filename) {
      reply.status(400).send({ error: 'Image and filename are required' });
      return;
    }

    // Extract base64 data
    const base64Match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!base64Match) {
      reply.status(400).send({ error: 'Invalid image format' });
      return;
    }

    const declaredMimeType = base64Match[1];
    const base64Data = base64Match[2] || '';
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file before processing
    const validationResult = await validateFileUpload(buffer, filename, declaredMimeType);
    if (!validationResult.valid) {
      reply.status(400).send({ error: validationResult.error });
      return;
    }

    // Generate secure filename
    const sanitizedFilename = sanitizeFilename(filename);
    const secureFilename = generateSecureFilename(sanitizedFilename, propertyId);
    const baseName = path.basename(secureFilename, path.extname(secureFilename));
    const tempPath = path.join(uploadDir, secureFilename);

    // Save temporary file
    await fs.writeFile(tempPath, buffer);

    try {
      // Optimize and generate multiple sizes
      const urls = await optimizeImage(tempPath, uploadDir, baseName);

      // Get current max order
      const maxOrder = await fastify.prisma.propertyImage.findFirst({
        where: { propertyId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      // Create database record with all URLs
      const propertyImage = await fastify.prisma.propertyImage.create({
        data: {
          propertyId,
          url: urls.medium || urls.original || '', // Default display URL
          urls: urls, // Store all sizes
          order: (maxOrder?.order ?? -1) + 1,
        },
      });

      reply.status(201).send(propertyImage);
    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(tempPath);
      } catch {}
      
      fastify.log.error('Image optimization failed:', error);
      reply.status(500).send({ error: 'Image processing failed' });
    }
  });

  // Get all images for a property
  fastify.get('/:propertyId/images', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { propertyId } = request.params as { propertyId: string };

    // Verify property belongs to tenant
    const property = await fastify.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
      },
    });

    if (!property) {
      reply.status(404).send({ error: 'Property not found' });
      return;
    }

    const images = await fastify.prisma.propertyImage.findMany({
      where: {
        propertyId,
      },
      orderBy: { order: 'asc' },
    });

    reply.send(images);
  });

  // Update image order
  fastify.put('/:propertyId/images/order', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['images'],
        properties: {
          images: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'order'],
              properties: {
                id: { type: 'string' },
                order: { type: 'integer', minimum: 0 },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { propertyId } = request.params as { propertyId: string };
    const { images } = request.body as z.infer<typeof updateImageOrderSchema>;

    // Verify property belongs to tenant
    const property = await fastify.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
      },
    });

    if (!property) {
      reply.status(404).send({ error: 'Property not found' });
      return;
    }

    // Update all image orders in a transaction
    await fastify.prisma.$transaction(
      images.map((img) =>
        fastify.prisma.propertyImage.update({
          where: {
            id: img.id,
          },
          data: {
            order: img.order,
          },
        })
      )
    );

    reply.send({ success: true });
  });

  // Delete an image
  fastify.delete('/:propertyId/images/:imageId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { propertyId, imageId } = request.params as { propertyId: string; imageId: string };

    // Verify property belongs to tenant
    const property = await fastify.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
      },
    });

    if (!property) {
      reply.status(404).send({ error: 'Property not found' });
      return;
    }

    // Find the image
    const image = await fastify.prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });

    if (!image) {
      reply.status(404).send({ error: 'Image not found' });
      return;
    }

    // Delete all image variants from disk
    try {
      await deleteImageVariants(image.url, uploadDir);
    } catch (error) {
      // Log error but continue with database deletion
      fastify.log.error('Failed to delete image files:', error);
    }

    // Delete from database
    await fastify.prisma.propertyImage.delete({
      where: { id: imageId },
    });

    // Reorder remaining images
    const remainingImages = await fastify.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
    });

    await fastify.prisma.$transaction(
      remainingImages.map((img, index) =>
        fastify.prisma.propertyImage.update({
          where: { id: img.id },
          data: { order: index },
        })
      )
    );

    reply.status(204).send();
  });
}