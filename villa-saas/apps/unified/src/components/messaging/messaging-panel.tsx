'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ConversationsList } from './conversations-list';
import { ChatWindow } from './chat-window';
import { messagingService, type Conversation } from '@/services/messaging.service';
import { useAuthStore } from '@/store/auth.store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

interface MessagingPanelProps {
  propertyId?: string;
  className?: string;
  defaultOpen?: boolean;
}

export function MessagingPanel({ propertyId, className, defaultOpen = false }: MessagingPanelProps) {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  useEffect(() => {
    // Connecter au WebSocket si authentifié
    if (user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        messagingService.connect(token);
      }
    }

    // Charger le nombre de messages non lus
    loadUnreadCount();

    return () => {
      messagingService.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const handleNewMessage = () => {
      loadUnreadCount();
    };

    messagingService.on('message:new', handleNewMessage);
    messagingService.on('notification:message', handleNewMessage);

    return () => {
      messagingService.off('message:new', handleNewMessage);
      messagingService.off('notification:message', handleNewMessage);
    };
  }, []);

  const loadUnreadCount = async () => {
    if (!user) return;
    
    try {
      const { data } = await messagingService.getUnreadCount();
      if (data) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // En mobile, fermer la liste quand on sélectionne une conversation
    if (isMobile) {
      // On utilisera un état local pour gérer ça
    }
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
  };

  // Desktop layout
  if (!isMobile && !isTablet) {
    return (
      <>
        {/* Bouton flottant */}
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40",
            className
          )}
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Panel de messagerie */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="w-[800px] max-w-[90vw] p-0">
            <div className="flex h-full">
              {/* Liste des conversations */}
              <div className="w-[320px] border-r h-full">
                <ConversationsList
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversation?.id}
                  currentUserId={user?.id}
                  propertyId={propertyId}
                />
              </div>

              {/* Chat window */}
              <div className="flex-1 h-full">
                {selectedConversation ? (
                  <ChatWindow
                    conversationId={selectedConversation.id}
                    currentUserId={user?.id}
                    onClose={handleCloseChat}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Sélectionnez une conversation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Mobile/Tablet layout
  return (
    <>
      {/* Bouton flottant */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40",
          className
        )}
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Panel de messagerie mobile */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          {!selectedConversation ? (
            <ConversationsList
              onSelectConversation={handleSelectConversation}
              selectedConversationId={undefined}
              currentUserId={user?.id}
              propertyId={propertyId}
            />
          ) : (
            <ChatWindow
              conversationId={selectedConversation.id}
              currentUserId={user?.id}
              onClose={() => setSelectedConversation(null)}
              isMobile
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}