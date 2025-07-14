import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getTenantId } from '@villa-saas/utils';
import { AutoResponseService } from './auto-response.service';

const createConversationSchema = z.object({
  propertyId: z.string().min(1).optional(),
  bookingId: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  message: z.string().min(1),
  guestEmail: z.string().email().optional(),
  guestName: z.string().min(1).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'LOCATION']).default('TEXT'),
  attachments: z.array(z.object({
    type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER']),
    name: z.string(),
    url: z.string(),
    size: z.number(),
    mimeType: z.string(),
  })).optional(),
});

export async function messagingRoutes(fastify: FastifyInstance): Promise<void> {
  const autoResponseService = new AutoResponseService(fastify);
  // Get conversations list
  fastify.get('/conversations', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const userId = request.user!.userId;
    const { status = 'ACTIVE', propertyId, page = 1, limit = 20 } = request.query as any;

    const where: any = {
      tenantId,
      status,
      participants: {
        some: {
          userId,
        },
      },
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const [conversations, total] = await Promise.all([
      fastify.prisma.conversation.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              images: {
                select: {
                  url: true,
                  urls: true,
                },
                take: 1,
                orderBy: { order: 'asc' },
              },
            },
          },
          booking: {
            select: {
              id: true,
              reference: true,
              checkIn: true,
              checkOut: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      fastify.prisma.conversation.count({ where }),
    ]);

    reply.send({
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get single conversation with messages
  fastify.get('/conversations/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const { page = 1, limit = 50 } = request.query as any;

    // Vérifier que l'utilisateur est participant
    const participant = await fastify.prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId,
      },
    });

    if (!participant) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }

    const conversation = await fastify.prisma.conversation.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        property: true,
        booking: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      reply.status(404).send({ error: 'Conversation not found' });
      return;
    }

    const [messages, totalMessages] = await Promise.all([
      fastify.prisma.message.findMany({
        where: {
          conversationId: id,
          deletedAt: null,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          attachments: true,
          readBy: {
            where: {
              userId,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      fastify.prisma.message.count({
        where: {
          conversationId: id,
          deletedAt: null,
        },
      }),
    ]);

    // Marquer les messages comme lus
    await fastify.prisma.messageRead.createMany({
      data: messages
        .filter(m => m.readBy.length === 0 && m.senderId !== userId)
        .map(m => ({
          messageId: m.id,
          userId,
        })),
      skipDuplicates: true,
    });

    // Réinitialiser le compteur de non-lus pour ce participant
    await fastify.prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        unreadCount: 0,
        lastSeen: new Date(),
      },
    });

    reply.send({
      conversation,
      messages: messages.reverse(), // Remettre dans l'ordre chronologique
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
      },
    });
  });

  // Create new conversation
  fastify.post('/conversations', {
    preHandler: (request, reply) => {
      // Permettre aux invités de créer des conversations
      if (!request.headers.authorization) {
        return;
      }
      return fastify.authenticate(request, reply);
    },
  }, async (request, reply) => {
    const validatedData = createConversationSchema.parse(request.body);
    const userId = request.user?.userId;
    
    let tenantId: string;
    let propertyOwnerId: string | null = null;
    let property: any = null;

    // Si c'est une conversation liée à une propriété, récupérer le tenant
    if (validatedData.propertyId) {
      property = await fastify.prisma.property.findUnique({
        where: { id: validatedData.propertyId },
        select: { 
          tenantId: true,
          tenant: {
            select: {
              users: {
                where: { role: 'OWNER' },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      });

      if (!property) {
        reply.status(404).send({ error: 'Property not found' });
        return;
      }

      tenantId = property.tenantId;
      propertyOwnerId = property.tenant.users[0]?.id || null;
    } else if (request.user) {
      tenantId = getTenantId(request);
    } else {
      reply.status(400).send({ error: 'Property ID required for guest conversations' });
      return;
    }

    // Créer la conversation
    const conversation = await fastify.prisma.conversation.create({
      data: {
        tenantId,
        propertyId: validatedData.propertyId,
        bookingId: validatedData.bookingId,
        subject: validatedData.subject,
        participants: {
          create: [
            // Ajouter l'utilisateur connecté ou l'invité
            ...(userId ? [{
              userId,
              role: 'MEMBER' as const,
            }] : [{
              guestEmail: validatedData.guestEmail!,
              guestName: validatedData.guestName!,
              role: 'GUEST' as const,
            }]),
            // Ajouter le propriétaire si c'est une conversation de propriété
            ...(propertyOwnerId && propertyOwnerId !== userId ? [{
              userId: propertyOwnerId,
              role: 'OWNER' as const,
            }] : []),
          ],
        },
      },
      include: {
        participants: true,
      },
    });

    // Créer le premier message
    const message = await fastify.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        senderEmail: !userId ? validatedData.guestEmail : undefined,
        senderName: !userId ? validatedData.guestName : undefined,
        content: validatedData.message,
        type: 'TEXT',
      },
    });

    // Mettre à jour la conversation
    await fastify.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: validatedData.message,
        lastMessageAt: new Date(),
        unreadCount: 1,
      },
    });

    // Mettre à jour le compteur de non-lus pour les autres participants
    if (propertyOwnerId && propertyOwnerId !== userId) {
      await fastify.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: conversation.id,
          userId: { not: userId || undefined },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });
    }

    // Émettre l'événement WebSocket pour la mise à jour temps réel
    if (fastify.io) {
      fastify.io.to(`conversation:${conversation.id}`).emit('message:new', message);
    }

    // Traiter les réponses automatiques pour les nouvelles conversations de manière asynchrone
    // pour éviter les timeouts
    setImmediate(() => {
      autoResponseService.processMessage({
        conversationId: conversation.id,
        message: validatedData.message,
        propertyId: validatedData.propertyId,
        tenantId,
        language: 'fr',
        guestName: validatedData.guestName,
        property: conversation.propertyId ? {
          name: property?.tenant.users[0]?.firstName || 'Notre propriété',
          address: '',
          city: '',
        } : undefined,
      }).catch(error => {
        fastify.log.error(error, 'Error processing auto response');
      });
    });

    reply.status(201).send({ conversation, message });
  });

  // Send message
  fastify.post('/conversations/:id/messages', {
    preHandler: (request, reply) => {
      // Permettre aux invités d'envoyer des messages
      if (!request.headers.authorization) {
        return;
      }
      return fastify.authenticate(request, reply);
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const validatedData = sendMessageSchema.parse(request.body);
    const userId = request.user?.userId;

    // Vérifier que l'utilisateur est participant
    if (userId) {
      const participant = await fastify.prisma.conversationParticipant.findFirst({
        where: {
          conversationId: id,
          userId,
        },
      });

      if (!participant) {
        reply.status(403).send({ error: 'Forbidden' });
        return;
      }
    }

    const conversation = await fastify.prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      reply.status(404).send({ error: 'Conversation not found' });
      return;
    }

    // Créer le message
    const message = await fastify.prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        content: validatedData.content,
        type: validatedData.type,
        attachments: validatedData.attachments ? {
          create: validatedData.attachments,
        } : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attachments: true,
      },
    });

    // Mettre à jour la conversation
    await fastify.prisma.conversation.update({
      where: { id },
      data: {
        lastMessage: validatedData.content,
        lastMessageAt: new Date(),
      },
    });

    // Mettre à jour le compteur de non-lus pour les autres participants
    await fastify.prisma.conversationParticipant.updateMany({
      where: {
        conversationId: id,
        userId: { not: userId || undefined },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // Émettre l'événement WebSocket pour la mise à jour temps réel
    if (fastify.io) {
      fastify.io.to(`conversation:${id}`).emit('message:new', message);
    }

    // Traiter les réponses automatiques
    if (!userId || conversation.participants.some(p => p.role === 'GUEST')) {
      const property = conversation.propertyId ? await fastify.prisma.property.findUnique({
        where: { id: conversation.propertyId },
        select: { name: true, address: true, city: true },
      }) : null;

      await autoResponseService.processMessage({
        conversationId: id,
        message: validatedData.content,
        propertyId: conversation.propertyId || undefined,
        tenantId: conversation.tenantId,
        language: 'fr',
        property: property ? {
          name: property.name,
          address: property.address,
          city: property.city,
        } : undefined,
      });
    }

    reply.status(201).send(message);
  });

  // Mark message as read
  fastify.post('/messages/:id/read', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const message = await fastify.prisma.message.findUnique({
      where: { id },
      select: {
        conversationId: true,
        conversation: {
          select: {
            participants: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!message || message.conversation.participants.length === 0) {
      reply.status(404).send({ error: 'Message not found' });
      return;
    }

    await fastify.prisma.messageRead.create({
      data: {
        messageId: id,
        userId,
      },
    });

    reply.status(204).send();
  });

  // Update conversation status
  fastify.patch('/conversations/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    const { status, priority, tags } = request.body as any;

    const conversation = await fastify.prisma.conversation.findFirst({
      where: {
        id,
        tenantId,
        participants: {
          some: {
            userId: request.user!.userId,
          },
        },
      },
    });

    if (!conversation) {
      reply.status(404).send({ error: 'Conversation not found' });
      return;
    }

    const updated = await fastify.prisma.conversation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(tags && { tags }),
      },
    });

    reply.send(updated);
  });

  // Get unread count
  fastify.get('/conversations/unread-count', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userId = request.user!.userId;

    const count = await fastify.prisma.conversationParticipant.aggregate({
      where: {
        userId,
        unreadCount: { gt: 0 },
      },
      _sum: {
        unreadCount: true,
      },
    });

    reply.send({ count: count._sum.unreadCount || 0 });
  });
}