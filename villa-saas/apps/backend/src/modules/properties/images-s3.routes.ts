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

    let buffer: Buffer;
    let mimeType: string;
    let metadata: any = {};

    // Vérifier le Content-Type pour déterminer comment traiter la requête
    const contentType = request.headers['content-type'];
    
    if (contentType?.includes('multipart/form-data')) {
      // Gérer le multipart/form-data
      try {
        const data = await request.file();
        if (!data) {
          return reply.code(400).send({ error: 'No file uploaded' });
        }
        buffer = await data.toBuffer();
        mimeType = data.mimetype;
        if (data.fields && data.fields.metadata) {
          const metadataValue = data.fields.metadata;
          if (typeof metadataValue === 'object' && metadataValue.value) {
            // Fastify multipart retourne un objet avec une propriété 'value'
            try {
              metadata = JSON.parse(metadataValue.value);
            } catch (e) {
              metadata = {};
            }
          } else if (typeof metadataValue === 'string') {
            try {
              metadata = JSON.parse(metadataValue);
            } catch (e) {
              metadata = {};
            }
          }
        }
      } catch (multipartError) {
        fastify.log.error('Multipart parsing error:', multipartError);
        return reply.code(400).send({ error: 'Invalid multipart data' });
      }
    } else {
      // Gérer le JSON avec base64
      const { image, filename } = request.body as { image: string; filename: string };
      
      if (!image || !filename) {
        return reply.code(400).send({ error: 'Image and filename are required' });
      }

      // Extraire le type MIME et les données base64
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return reply.code(400).send({ error: 'Invalid base64 image format' });
      }
      
      mimeType = matches[1];
      const base64Data = matches[2];
      buffer = Buffer.from(base64Data, 'base64');
    }

    try {
      fastify.log.info(`Starting S3 upload for property ${propertyId}, mime: ${mimeType}, buffer size: ${buffer.length}`);
      
      // Upload vers S3 avec génération des différentes tailles
      const uploadResult = await s3Service.uploadImage(buffer, mimeType, {
        folder: `properties/${tenantId}/${propertyId}`,
      });
      
      fastify.log.info(`S3 upload successful: ${JSON.stringify(uploadResult)}`);

      // Obtenir l'ordre de la prochaine image
      const imageCount = await fastify.prisma.propertyImage.count({
        where: { propertyId },
      });
      
      // Obtenir le maximum actuel d'ordre pour éviter les conflits
      const maxOrderImage = await fastify.prisma.propertyImage.findFirst({
        where: { propertyId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      
      // Utiliser le max + 1 ou le count si c'est plus grand (en cas de trous dans la séquence)
      const nextOrder = Math.max((maxOrderImage?.order ?? -1) + 1, imageCount);

      // Sauvegarder en base de données
      const image = await fastify.prisma.propertyImage.create({
        data: {
          propertyId,
          url: uploadResult.url,
          urls: uploadResult.urls,
          alt: metadata.alt || '',
          caption: metadata.caption,
          order: nextOrder,
          isPrimary: imageCount === 0, // Première image est principale
        },
      });

      fastify.log.info(`Image uploaded for property ${propertyId}: ${uploadResult.key}`);

      return reply.send(image);
    } catch (error: any) {
      fastify.log.error({ error, message: error?.message, stack: error?.stack }, 'S3 upload error');
      return reply.code(500).send({ 
        error: 'Failed to upload image',
        message: error?.message || 'Unknown error'
      });
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