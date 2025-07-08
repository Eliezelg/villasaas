import { apiClient } from '@/lib/api-client';
import { io, Socket } from 'socket.io-client';

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  propertyId?: string;
  bookingId?: string;
  property?: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      urls?: {
        small?: string;
        medium?: string;
      };
    }>;
  };
  booking?: {
    id: string;
    reference: string;
    checkIn: string;
    checkOut: string;
  };
  participants: ConversationParticipant[];
  messages?: Message[];
  subject?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  tags: string[];
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  guestEmail?: string;
  guestName?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  lastSeen?: string;
  isTyping: boolean;
  unreadCount: number;
}

export interface Message {
  id: string;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
  senderId?: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  senderEmail?: string;
  senderName?: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'SYSTEM' | 'LOCATION';
  attachments: MessageAttachment[];
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  readBy?: Array<{ userId: string; readAt: string }>;
  editedAt?: string;
  deletedAt?: string;
  metadata?: any;
  tempId?: string;
}

export interface MessageAttachment {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface ConversationFilters {
  status?: 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
  propertyId?: string;
  page?: number;
  limit?: number;
}

export interface CreateConversationData {
  propertyId?: string;
  bookingId?: string;
  subject?: string;
  message: string;
  guestEmail?: string;
  guestName?: string;
}

export interface SendMessageData {
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'LOCATION';
  attachments?: Omit<MessageAttachment, 'id'>[];
}

class MessagingService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  // Initialiser la connexion WebSocket
  connect(token?: string) {
    if (this.socket?.connected) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    this.socket = io(baseUrl, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Événements de messagerie
    this.socket.on('message:new', (message: Message) => {
      this.emit('message:new', message);
    });

    this.socket.on('message:read', (data: { messageId: string; userId: string; readAt: string }) => {
      this.emit('message:read', data);
    });

    this.socket.on('typing:update', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      this.emit('typing:update', data);
    });

    this.socket.on('presence:update', (data: { userId: string; status: string }) => {
      this.emit('presence:update', data);
    });

    this.socket.on('notification:message', (data: { conversationId: string; message: Message }) => {
      this.emit('notification:message', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Gestion des événements
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // API REST
  async getConversations(filters?: ConversationFilters) {
    return apiClient.get<{
      conversations: Conversation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>('/api/messaging/conversations', { params: filters });
  }

  async getConversation(id: string, page = 1, limit = 50) {
    return apiClient.get<{
      conversation: Conversation;
      messages: Message[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/messaging/conversations/${id}`, { params: { page, limit } });
  }

  async createConversation(data: CreateConversationData) {
    return apiClient.post<{
      conversation: Conversation;
      message: Message;
    }>('/api/messaging/conversations', data);
  }

  async sendMessage(conversationId: string, data: SendMessageData) {
    // Créer un ID temporaire pour le message
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Émettre via WebSocket pour une réponse instantanée
    if (this.socket?.connected) {
      this.socket.emit('message:send', {
        conversationId,
        content: data.content,
        type: data.type,
        tempId,
      });
    }

    // Aussi envoyer via l'API REST pour la persistance
    return apiClient.post<Message>(`/api/messaging/conversations/${conversationId}/messages`, data);
  }

  async markAsRead(messageId: string) {
    if (this.socket?.connected) {
      this.socket.emit('message:read', messageId);
    }
    
    return apiClient.post(`/api/messaging/messages/${messageId}/read`);
  }

  async updateConversation(id: string, data: {
    status?: 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    tags?: string[];
  }) {
    return apiClient.patch<Conversation>(`/api/messaging/conversations/${id}`, data);
  }

  async getUnreadCount() {
    return apiClient.get<{ count: number }>('/api/messaging/conversations/unread-count');
  }

  // WebSocket events
  joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:join', conversationId);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:leave', conversationId);
    }
  }

  startTyping(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing:start', conversationId);
    }
  }

  stopTyping(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', conversationId);
    }
  }

  updatePresence(status: 'online' | 'away' | 'offline') {
    if (this.socket?.connected) {
      this.socket.emit('presence:update', status);
    }
  }

  // Auto-response API
  async getAutoResponseTemplates(filters?: { category?: string; trigger?: string; isActive?: boolean }) {
    return apiClient.get('/api/messaging/auto-response/templates', { params: filters });
  }

  async getAutoResponseTemplate(id: string) {
    return apiClient.get(`/api/messaging/auto-response/templates/${id}`);
  }

  async createAutoResponseTemplate(data: any) {
    return apiClient.post('/api/messaging/auto-response/templates', data);
  }

  async updateAutoResponseTemplate(id: string, data: any) {
    return apiClient.patch(`/api/messaging/auto-response/templates/${id}`, data);
  }

  async deleteAutoResponseTemplate(id: string) {
    return apiClient.delete(`/api/messaging/auto-response/templates/${id}`);
  }

  async getAutoResponseRules(filters?: { propertyId?: string; isActive?: boolean }) {
    return apiClient.get('/api/messaging/auto-response/rules', { params: filters });
  }

  async createAutoResponseRule(data: any) {
    return apiClient.post('/api/messaging/auto-response/rules', data);
  }

  async updateAutoResponseRule(id: string, data: any) {
    return apiClient.patch(`/api/messaging/auto-response/rules/${id}`, data);
  }

  async deleteAutoResponseRule(id: string) {
    return apiClient.delete(`/api/messaging/auto-response/rules/${id}`);
  }

  async initializeAutoResponseTemplates() {
    return apiClient.post('/api/messaging/auto-response/initialize');
  }

  async getChatbotStatus(conversationId: string) {
    return apiClient.get(`/api/messaging/auto-response/chatbot/${conversationId}`);
  }

  async toggleChatbot(conversationId: string, enabled: boolean) {
    return apiClient.post(`/api/messaging/auto-response/chatbot/${conversationId}/toggle`, { enabled });
  }
}

export const messagingService = new MessagingService();