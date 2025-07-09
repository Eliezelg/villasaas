'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationsList } from '@/components/messaging/conversations-list';
import { ChatWindow } from '@/components/messaging/chat-window';
import { messagingService, type Conversation } from '@/services/messaging.service';
import { useAuthStore } from '@/store/auth.store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const conversationId = searchParams.get('conversation');

  useEffect(() => {
    // Connecter au WebSocket
    if (user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        messagingService.connect(token);
      }
    }

    return () => {
      messagingService.disconnect();
    };
  }, [user]);

  useEffect(() => {
    // Si un ID de conversation est passé en paramètre, le charger
    if (conversationId && !selectedConversation) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    try {
      const { data } = await messagingService.getConversation(id);
      if (data) {
        setSelectedConversation(data.conversation);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Mettre à jour l'URL sans recharger la page
    const url = new URL(window.location.href);
    url.searchParams.set('conversation', conversation.id);
    window.history.pushState({}, '', url);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
    
    // Retirer le paramètre de l'URL
    const url = new URL(window.location.href);
    url.searchParams.delete('conversation');
    window.history.pushState({}, '', url);
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        {!selectedConversation ? (
          <ConversationsList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={undefined}
            currentUserId={user?.id}
          />
        ) : (
          <ChatWindow
            conversationId={selectedConversation.id}
            currentUserId={user?.id}
            onClose={handleCloseChat}
            isMobile
          />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Liste des conversations */}
      <div className="w-[320px] border-r">
        <ConversationsList
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversation?.id}
          currentUserId={user?.id}
        />
      </div>

      {/* Fenêtre de chat */}
      <div className="flex-1">
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
              <p className="text-lg">Sélectionnez une conversation</p>
              <p className="text-sm mt-2">ou attendez qu'un client vous contacte</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}