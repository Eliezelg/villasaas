"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const socket_io_1 = require("socket.io");
const websocketPlugin = async (fastify) => {
    const io = new socket_io_1.Server(fastify.server, {
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = [
                    'http://localhost:3000',
                    /^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/,
                ];
                if (!origin) {
                    callback(null, true);
                    return;
                }
                const isAllowed = allowedOrigins.some(allowed => {
                    if (allowed instanceof RegExp) {
                        return allowed.test(origin);
                    }
                    return allowed === origin;
                });
                callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
            },
            credentials: true,
        },
    });
    // Authentification middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                // Permettre les connexions anonymes pour les invités
                socket.data.user = null;
                return next();
            }
            const decoded = fastify.jwt.verify(token);
            socket.data.user = {
                userId: decoded.userId,
                tenantId: decoded.tenantId,
                role: decoded.role,
            };
            socket.data.conversations = new Set();
            next();
        }
        catch (error) {
            next(new Error('Authentication failed'));
        }
    });
    io.on('connection', async (socket) => {
        const user = socket.data.user;
        fastify.log.info(`Socket connected: ${socket.id} - User: ${user?.userId || 'Guest'}`);
        // Rejoindre les rooms des conversations de l'utilisateur
        if (user) {
            try {
                const participants = await fastify.prisma.conversationParticipant.findMany({
                    where: { userId: user.userId },
                    select: { conversationId: true },
                });
                for (const participant of participants) {
                    socket.join(`conversation:${participant.conversationId}`);
                    socket.data.conversations.add(participant.conversationId);
                }
                // Rejoindre la room du tenant pour les notifications globales
                socket.join(`tenant:${user.tenantId}`);
                // Rejoindre la room personnelle pour les notifications directes
                socket.join(`user:${user.userId}`);
            }
            catch (error) {
                fastify.log.error(error, 'Error joining conversation rooms');
            }
        }
        // Événements de messagerie
        socket.on('conversation:join', async (conversationId) => {
            // Vérifier que l'utilisateur est participant
            if (user) {
                const participant = await fastify.prisma.conversationParticipant.findFirst({
                    where: {
                        conversationId,
                        userId: user.userId,
                    },
                });
                if (participant) {
                    socket.join(`conversation:${conversationId}`);
                    socket.data.conversations.add(conversationId);
                    // Marquer comme en ligne
                    await fastify.prisma.conversationParticipant.update({
                        where: { id: participant.id },
                        data: { lastSeen: new Date() },
                    });
                }
            }
        });
        socket.on('conversation:leave', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            socket.data.conversations.delete(conversationId);
        });
        socket.on('message:send', async (data) => {
            try {
                if (!socket.data.conversations.has(data.conversationId)) {
                    socket.emit('error', { message: 'Not authorized for this conversation' });
                    return;
                }
                // Créer le message
                const message = await fastify.prisma.message.create({
                    data: {
                        conversationId: data.conversationId,
                        senderId: user?.userId,
                        content: data.content,
                        type: (data.type || 'TEXT'),
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
                    where: { id: data.conversationId },
                    data: {
                        lastMessage: data.content,
                        lastMessageAt: new Date(),
                    },
                });
                // Mettre à jour les compteurs de non-lus
                await fastify.prisma.conversationParticipant.updateMany({
                    where: {
                        conversationId: data.conversationId,
                        userId: { not: user?.userId },
                    },
                    data: {
                        unreadCount: { increment: 1 },
                    },
                });
                // Émettre le message à tous les participants
                io.to(`conversation:${data.conversationId}`).emit('message:new', {
                    ...message,
                    tempId: data.tempId,
                });
                // Émettre une notification aux participants hors ligne
                const participants = await fastify.prisma.conversationParticipant.findMany({
                    where: {
                        conversationId: data.conversationId,
                        userId: { not: user?.userId },
                    },
                    include: {
                        user: true,
                    },
                });
                for (const participant of participants) {
                    if (participant.user) {
                        io.to(`user:${participant.userId}`).emit('notification:message', {
                            conversationId: data.conversationId,
                            message: message,
                        });
                    }
                }
            }
            catch (error) {
                fastify.log.error(error, 'Error sending message');
                socket.emit('error', { message: 'Failed to send message', tempId: data.tempId });
            }
        });
        socket.on('typing:start', (conversationId) => {
            if (socket.data.conversations.has(conversationId) && user) {
                socket.to(`conversation:${conversationId}`).emit('typing:update', {
                    conversationId,
                    userId: user.userId,
                    isTyping: true,
                });
            }
        });
        socket.on('typing:stop', (conversationId) => {
            if (socket.data.conversations.has(conversationId) && user) {
                socket.to(`conversation:${conversationId}`).emit('typing:update', {
                    conversationId,
                    userId: user.userId,
                    isTyping: false,
                });
            }
        });
        socket.on('message:read', async (messageId) => {
            if (!user)
                return;
            try {
                const message = await fastify.prisma.message.findUnique({
                    where: { id: messageId },
                    select: { conversationId: true },
                });
                if (message && socket.data.conversations.has(message.conversationId)) {
                    await fastify.prisma.messageRead.create({
                        data: {
                            messageId,
                            userId: user.userId,
                        },
                    }).catch(() => {
                        // Ignorer si déjà lu
                    });
                    // Émettre la mise à jour aux autres participants
                    socket.to(`conversation:${message.conversationId}`).emit('message:read', {
                        messageId,
                        userId: user.userId,
                        readAt: new Date(),
                    });
                }
            }
            catch (error) {
                fastify.log.error(error, 'Error marking message as read');
            }
        });
        socket.on('presence:update', async (status) => {
            if (!user)
                return;
            // Mettre à jour le statut de présence dans toutes les conversations
            for (const conversationId of socket.data.conversations) {
                socket.to(`conversation:${conversationId}`).emit('presence:update', {
                    userId: user.userId,
                    status,
                });
            }
        });
        socket.on('disconnect', async () => {
            fastify.log.info(`Socket disconnected: ${socket.id}`);
            if (user) {
                // Mettre à jour lastSeen
                await fastify.prisma.conversationParticipant.updateMany({
                    where: {
                        userId: user.userId,
                        conversationId: { in: Array.from(socket.data.conversations) },
                    },
                    data: { lastSeen: new Date() },
                });
                // Notifier les autres participants
                for (const conversationId of socket.data.conversations) {
                    socket.to(`conversation:${conversationId}`).emit('presence:update', {
                        userId: user.userId,
                        status: 'offline',
                    });
                }
            }
        });
    });
    fastify.decorate('io', io);
    fastify.addHook('onClose', async () => {
        await new Promise((resolve) => {
            io.close(() => {
                resolve();
            });
        });
    });
};
exports.default = (0, fastify_plugin_1.default)(websocketPlugin, {
    name: 'websocket',
});
//# sourceMappingURL=websocket.js.map