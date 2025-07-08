'use client';

import { useState, useEffect } from 'react';
import { Search, Archive, MessageSquare, Star } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { messagingService, type Conversation } from '@/services/messaging.service';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  currentUserId?: string;
  propertyId?: string;
}

export function ConversationsList({ 
  onSelectConversation, 
  selectedConversationId,
  currentUserId,
  propertyId 
}: ConversationsListProps) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, [propertyId, activeTab]);

  useEffect(() => {
    const handleNewMessage = (message: any) => {
      // Mettre à jour la liste des conversations
      setConversations(prev => {
        const updated = [...prev];
        const index = updated.findIndex(c => c.id === message.conversationId);
        
        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            unreadCount: updated[index].unreadCount + (message.senderId !== currentUserId ? 1 : 0),
          };
          // Remonter la conversation en haut
          updated.unshift(updated.splice(index, 1)[0]);
        }
        
        return updated;
      });

      // Mettre à jour le compteur non-lus
      if (message.senderId !== currentUserId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleMessageRead = (data: { messageId: string; userId: string }) => {
      if (data.userId === currentUserId) {
        loadUnreadCount();
      }
    };

    messagingService.on('message:new', handleNewMessage);
    messagingService.on('message:read', handleMessageRead);

    return () => {
      messagingService.off('message:new', handleNewMessage);
      messagingService.off('message:read', handleMessageRead);
    };
  }, [currentUserId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const filters: any = {
        status: activeTab === 'archived' ? 'ARCHIVED' : 'ACTIVE',
      };
      
      if (propertyId) {
        filters.propertyId = propertyId;
      }

      const { data, error } = await messagingService.getConversations(filters);
      
      if (error || !data) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les conversations",
          variant: "destructive",
        });
        return;
      }

      let filteredConversations = data.conversations;
      
      if (activeTab === 'unread') {
        filteredConversations = filteredConversations.filter(c => c.unreadCount > 0);
      }

      setConversations(filteredConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { data } = await messagingService.getUnreadCount();
      if (data) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const other = conversation.participants.find(p => 
      p.userId !== currentUserId || p.guestEmail
    );
    
    return other;
  };

  const formatLastMessageTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(messageDate, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Hier';
    } else if (diffInHours < 168) { // 7 jours
      return format(messageDate, 'EEEE', { locale: fr });
    } else {
      return format(messageDate, 'dd/MM/yyyy');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!search) return true;
    
    const other = getOtherParticipant(conv);
    const participantName = other?.user 
      ? `${other.user.firstName} ${other.user.lastName}`
      : other?.guestName || '';
    
    const propertyName = conv.property?.name || '';
    const subject = conv.subject || '';
    const lastMessage = conv.lastMessage || '';

    const searchLower = search.toLowerCase();
    return (
      participantName.toLowerCase().includes(searchLower) ||
      propertyName.toLowerCase().includes(searchLower) ||
      subject.toLowerCase().includes(searchLower) ||
      lastMessage.toLowerCase().includes(searchLower)
    );
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
          Messages
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3 px-4">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Non lus
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">Archivés</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value={activeTab} className="mt-0">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
                <p>Aucune conversation</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conversation) => {
                  const other = getOtherParticipant(conversation);
                  const participantName = other?.user 
                    ? `${other.user.firstName} ${other.user.lastName}`
                    : other?.guestName || 'Invité';
                  const isSelected = conversation.id === selectedConversationId;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => onSelectConversation(conversation)}
                      className={cn(
                        "w-full p-4 hover:bg-gray-50 transition-colors text-left",
                        isSelected && "bg-purple-50 hover:bg-purple-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {participantName.charAt(0).toUpperCase()}
                          </div>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold truncate">{participantName}</h4>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {conversation.lastMessageAt && formatLastMessageTime(conversation.lastMessageAt)}
                            </span>
                          </div>
                          
                          {conversation.property && (
                            <p className="text-sm text-gray-600 truncate mb-1">
                              {conversation.property.name}
                            </p>
                          )}
                          
                          <p className={cn(
                            "text-sm truncate",
                            conversation.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"
                          )}>
                            {conversation.lastMessage || 'Nouvelle conversation'}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-1">
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            {conversation.priority === 'HIGH' && (
                              <Badge variant="outline" className="h-5 px-1.5 text-xs">
                                Priorité
                              </Badge>
                            )}
                            {conversation.priority === 'URGENT' && (
                              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}