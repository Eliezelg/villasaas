import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { S3Service } from '../../services/s3.service';

const updateImageOrderSchema = z.object({
  images: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0),
  })),
});

const imageMetadataSchema = z.object({
  alt: z.string().optional(),
  caption: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
});

export async function propertyImageS3Routes(fastify: FastifyInstance): Promise<void> {
  const s3Service = new S3Service(fastify.s3);

  // Upload images for a property
  fastify.post('/:propertyId/images', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Upload des images pour une propriété',
      tags: ['properties', 'images'],
      params: {
        type: 'object',
        properties: {
          propertyId: { type: 'string' },
        },
        required: ['propertyId'],
      },
    },
  }, async (request, reply) => {
    const { tenantId } = request;
    const { propertyId } = request.params as { propertyId: string };

    // Vérifier que la propriété appartient au tenant
    const property = await fastify.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
      },
    });

    if (!property) {
      return reply.code(404).send({ error: 'Property not found' });
    }

    // Gérer le multipart/form-data
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      const buffer = await data.toBuffer();
      const metadata = data.fields.metadata ? 
        JSON.parse(data.fields.metadata as string) : {};

      // Upload vers S3 avec génération des différentes tailles
      const uploadResult = await s3Service.uploadImage(buffer, data.mimetype, {
        folder: `properties/${tenantId}/${propertyId}`,
      });

      // Obtenir l'ordre de la prochaine image
      const lastImage = await fastify.prisma.propertyImage.findFirst({
        where: { propertyId },
        orderBy: { order: 'desc' },
      });
      const nextOrder = (lastImage?.order || -1) + 1;

      // Sauvegarder en base de données
      const image = await fastify.prisma.propertyImage.create({
        data: {
          propertyId,
          url: uploadResult.url,
          urls: uploadResult.urls,
          alt: metadata.alt || '',
          caption: metadata.caption,
          order: nextOrder,
          isPrimary: nextOrder === 0,
        },
      });

      fastify.log.info(`Image uploaded for property ${propertyId}: ${uploadResult.key}`);

      return reply.send(image);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to upload image' });
    }
  });

  // Get presigned URL for direct upload
  fastify.get('/:propertyId/images/presigned-url', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtenir une URL présignée pour upload direct',
      tags: ['properties', 'images'],
      querystring: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          contentType: { type: 'string' },
        },
        required: ['filename', 'contentType'],
      },
    },
  }, async (request, reply) => {
    const { tenantId } = request;
    const { propertyId } = request.params as { propertyId: string };
    const { filename, contentType } = request.query as { filename: string; contentType: string };

    // Vérifier que la propriété appartient au tenant
    const property = await fastify.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
      },
    });

    if (!property) {
      return reply.code(404).send({ error: 'Property not found' });
    }

    try {
      const key = `properties/${tenantId}/${propertyId}/${Date.now()}-${filename}`;
      const uploadUrl = await s3Service.getPresignedUploadUrl(key, contentType);

      return reply.send({
        uploadUrl,
        key,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate upload URL' });
    }
  });

  // Update image order
  fastify.put('/:propertyId/images/order', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Mettre à jour l\'ordre des images',
      tags: ['properties', 'images'],
    },
  }, async (request, reply) => {
    const { tenantId } = request;
    const { propertyId } = request.params as { propertyId: string };
    
    const validation = updateImageOrderSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    // Vérifier que la propriété appartient au tenant
    const property = await fastify.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
      },
      include: {
        images: true,
      },
    });

    if (!property) {
      return reply.code(404).send({ error: 'Property not found' });
    }

    const { images } = validation.data;

    // Vérifier que toutes les images appartiennent à la propriété
    const imageIds = images.map(img => img.id);
    const propertyImageIds = property.images.map(img => img.id);
    
    if (!imageIds.every(id => propertyImageIds.includes(id))) {
      return reply.code(400).send({ error: 'Invalid image IDs' });
    }

    // Mettre à jour l'ordre des images
    const updatePromises = images.map(img =>
      fastify.prisma.propertyImage.update({
        where: { id: img.id },
        data: { 
          order: img.order,
          isPrimary: img.order === 0,
        },
      })
    );

    await Promise.all(updatePromises);

    return reply.send({ success: true });
  });

  // Update image metadata
  fastify.patch('/:propertyId/images/:imageId', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Mettre à jour les métadonnées d\'une image',
      tags: ['properties', 'images'],
    },
  }, async (request, reply) => {
    const { tenantId } = request;
    const { propertyId, imageId } = request.params as { propertyId: string; imageId: string };
    
    const validation = imageMetadataSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    // Vérifier que la propriété appartient au tenant
    const property = await fastify.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
      },
    });

    if (!property) {
      return reply.code(404).send({ error: 'Property not found' });
    }

    // Vérifier que l'image appartient à la propriété
    const image = await fastify.prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });

    if (!image) {
      return reply.code(404).send({ error: 'Image not found' });
    }

    // Mettre à jour les métadonnées
    const updatedImage = await fastify.prisma.propertyImage.update({
      where: { id: imageId },
      data: validation.data,
    });

    return reply.send(updatedImage);
  });

  // Delete an image
  fastify.delete('/:propertyId/images/:imageId', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Supprimer une image',
      tags: ['properties', 'images'],
    },
  }, async (request, reply) => {
    const { tenantId } = request;
    const { propertyId, imageId } = request.params as { propertyId: string; imageId: string };

    // Vérifier que la propriété appartient au tenant
    const property = await fastify.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
      },
    });

    if (!property) {
      return reply.code(404).send({ error: 'Property not found' });
    }

    // Récupérer l'image
    const image = await fastify.prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });

    if (!image) {
      return reply.code(404).send({ error: 'Image not found' });
    }

    try {
      // Extraire la clé de base depuis l'URL
      const urlParts = image.url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const baseKey = filename.replace(/-[^-]+\.jpg$/, '');
      const fullKey = `properties/${tenantId}/${propertyId}/${baseKey}`;

      // Supprimer de S3
      await s3Service.deleteImage(fullKey);

      // Supprimer de la base de données
      await fastify.prisma.propertyImage.delete({
        where: { id: imageId },
      });

      // Réorganiser l'ordre des images restantes
      const remainingImages = await fastify.prisma.propertyImage.findMany({
        where: { propertyId },
        orderBy: { order: 'asc' },
      });

      const updatePromises = remainingImages.map((img, index) =>
        fastify.prisma.propertyImage.update({
          where: { id: img.id },
          data: { 
            order: index,
            isPrimary: index === 0,
          },
        })
      );

      await Promise.all(updatePromises);

      fastify.log.info(`Image deleted for property ${propertyId}: ${imageId}`);

      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete image' });
    }
  });
}