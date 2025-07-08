'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video, 
  X,
  ArrowLeft,
  Image as ImageIcon,
  File,
  Mic,
  CheckCheck,
  Check
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { messagingService, type Conversation, type Message } from '@/services/messaging.service';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversationId: string;
  onClose?: () => void;
  currentUserId?: string;
  isMobile?: boolean;
}

export function ChatWindow({ conversationId, onClose, currentUserId, isMobile }: ChatWindowProps) {
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Charger la conversation et les messages
  useEffect(() => {
    loadConversation();
    messagingService.joinConversation(conversationId);

    return () => {
      messagingService.leaveConversation(conversationId);
    };
  }, [conversationId]);

  // Écouter les événements WebSocket
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        
        // Marquer comme lu si le message n'est pas de nous
        if (message.senderId !== currentUserId) {
          messagingService.markAsRead(message.id);
        }
      }
    };

    const handleMessageRead = (data: { messageId: string; userId: string; readAt: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, readBy: [...(msg.readBy || []), { userId: data.userId, readAt: data.readAt }] }
            : msg
        )
      );
    };

    const handleTypingUpdate = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    messagingService.on('message:new', handleNewMessage);
    messagingService.on('message:read', handleMessageRead);
    messagingService.on('typing:update', handleTypingUpdate);

    return () => {
      messagingService.off('message:new', handleNewMessage);
      messagingService.off('message:read', handleMessageRead);
      messagingService.off('typing:update', handleTypingUpdate);
    };
  }, [conversationId, currentUserId]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const { data, error } = await messagingService.getConversation(conversationId);
      
      if (error || !data) {
        toast({
          title: "Erreur",
          description: "Impossible de charger la conversation",
          variant: "destructive",
        });
        return;
      }

      setConversation(data.conversation);
      setMessages(data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    const messageContent = message.trim();
    setMessage('');
    setSending(true);

    try {
      const { error } = await messagingService.sendMessage(conversationId, {
        content: messageContent,
        type: 'TEXT',
      });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer le message",
          variant: "destructive",
        });
        setMessage(messageContent); // Restaurer le message
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageContent); // Restaurer le message
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    messagingService.startTyping(conversationId);

    typingTimeoutRef.current = setTimeout(() => {
      messagingService.stopTyping(conversationId);
    }, 2000);
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return `Hier ${format(messageDate, 'HH:mm')}`;
    } else {
      return format(messageDate, 'dd MMM HH:mm', { locale: fr });
    }
  };

  const getMessageStatus = (message: Message) => {
    if (!message.senderId || message.senderId !== currentUserId) return null;

    const readBy = message.readBy || [];
    const otherParticipants = conversation?.participants.filter(p => p.userId !== currentUserId) || [];
    const allRead = otherParticipants.every(p => 
      readBy.some(r => r.userId === p.userId)
    );

    if (allRead && readBy.length > 0) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    } else if (message.status === 'SENT' || message.status === 'DELIVERED') {
      return <Check className="h-4 w-4 text-gray-400" />;
    }
    
    return null;
  };

  const getOtherParticipant = () => {
    if (!conversation) return null;
    
    const other = conversation.participants.find(p => 
      p.userId !== currentUserId || p.guestEmail
    );
    
    return other;
  };

  const otherParticipant = getOtherParticipant();
  const participantName = otherParticipant?.user 
    ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
    : otherParticipant?.guestName || 'Invité';

  const typingUsersList = Array.from(typingUsers).map(userId => {
    const participant = conversation?.participants.find(p => p.userId === userId);
    return participant?.user?.firstName || 'Quelqu\'un';
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <Avatar className="h-10 w-10">
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
              {participantName.charAt(0).toUpperCase()}
            </div>
          </Avatar>
          
          <div>
            <h3 className="font-semibold">{participantName}</h3>
            {conversation?.property && (
              <p className="text-sm text-gray-500">{conversation.property.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Archiver</DropdownMenuItem>
              <DropdownMenuItem>Marquer comme important</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Bloquer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {!isMobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUserId || 
                       (!msg.senderId && !currentUserId && msg.senderEmail);
          const showDate = index === 0 || 
            new Date(messages[index - 1].createdAt).toDateString() !== 
            new Date(msg.createdAt).toDateString();

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center text-xs text-gray-500 my-4">
                  {format(new Date(msg.createdAt), 'EEEE d MMMM', { locale: fr })}
                </div>
              )}
              
              <div className={cn(
                "flex gap-2",
                isOwn ? "justify-end" : "justify-start"
              )}>
                {!isOwn && (
                  <Avatar className="h-8 w-8 mt-auto">
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                      {(msg.sender?.firstName || msg.senderName || 'I').charAt(0).toUpperCase()}
                    </div>
                  </Avatar>
                )}
                
                <div className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2",
                  isOwn 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-100 text-gray-900"
                )}>
                  {msg.type === 'TEXT' && (
                    <p className="break-words">{msg.content}</p>
                  )}
                  
                  {msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-2">
                          {att.type === 'IMAGE' ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <File className="h-4 w-4" />
                          )}
                          <span className="text-sm underline">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex items-center gap-1 mt-1",
                    isOwn ? "justify-end" : "justify-start"
                  )}>
                    <span className={cn(
                      "text-xs",
                      isOwn ? "text-white/70" : "text-gray-500"
                    )}>
                      {formatMessageDate(msg.createdAt)}
                    </span>
                    {isOwn && getMessageStatus(msg)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {typingUsersList.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>
              {typingUsersList.join(', ')} {typingUsersList.length === 1 ? 'écrit' : 'écrivent'}...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Écrivez votre message..."
            className="flex-1"
            disabled={sending}
          />
          
          <Button type="button" variant="ghost" size="icon">
            <Mic className="h-5 w-5" />
          </Button>
          
          <Button 
            type="submit" 
            size="icon"
            disabled={!message.trim() || sending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}