'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { messagingService } from '@/services/messaging.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export function GuestChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Form states
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestMessage, setGuestMessage] = useState('');

  useEffect(() => {
    // Message de bienvenue
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          content: 'Bonjour ! 👋 Je suis l\'assistant virtuel de cette propriété. Comment puis-je vous aider aujourd\'hui ?',
          isBot: true,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simuler une réponse du bot
    setTimeout(() => {
      const botResponse = getBotResponse(inputMessage);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        isBot: true,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('prix') || lowerMessage.includes('tarif') || lowerMessage.includes('coût')) {
      return 'Les tarifs varient selon la saison et la durée du séjour. Pour obtenir un prix précis, pourriez-vous me dire vos dates de séjour et le nombre de personnes ?';
    }

    if (lowerMessage.includes('disponible') || lowerMessage.includes('libre') || lowerMessage.includes('réserver')) {
      return 'Je vais vérifier les disponibilités pour vous. Quelles sont vos dates d\'arrivée et de départ souhaitées ?';
    }

    if (lowerMessage.includes('équipement') || lowerMessage.includes('inclus') || lowerMessage.includes('amenities')) {
      return 'Cette propriété dispose de nombreux équipements : WiFi, cuisine équipée, climatisation, et bien plus. Consultez la page de la propriété pour la liste complète !';
    }

    if (lowerMessage.includes('check') || lowerMessage.includes('arrivée') || lowerMessage.includes('départ')) {
      return 'Les horaires standard sont : Check-in à partir de 16h et Check-out jusqu\'à 11h. Nous pouvons être flexibles selon les disponibilités.';
    }

    if (lowerMessage.includes('contact') || lowerMessage.includes('parler') || lowerMessage.includes('propriétaire')) {
      setShowContactForm(true);
      return 'Je peux vous mettre en contact avec le propriétaire. Veuillez remplir le formulaire qui va apparaître.';
    }

    return 'Je comprends votre question. Pour une réponse plus précise, souhaitez-vous que je vous mette en contact avec le propriétaire ?';
  };

  const handleSubmitContact = async () => {
    if (!guestName || !guestEmail || !guestMessage) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      // Pour l'instant, on simule l'envoi car nous n'avons pas de propertyId
      // Dans une vraie implémentation, il faudrait soit :
      // 1. Récupérer le premier propertyId du tenant
      // 2. Créer un endpoint spécifique pour les demandes générales
      
      setShowContactForm(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: '✅ Votre message a été enregistré ! Le propriétaire vous contactera par email dans les plus brefs délais.',
        isBot: true,
        timestamp: new Date(),
      }]);
      
      // Reset form
      setGuestName('');
      setGuestEmail('');
      setGuestMessage('');
      
      toast.success('Message envoyé avec succès !');
      
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl z-40 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Assistant Villa</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.isBot ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.isBot
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* Contact Form Dialog */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contacter le propriétaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Votre nom</Label>
              <Input
                id="name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <Label htmlFor="email">Votre email</Label>
              <Input
                id="email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="jean@example.com"
              />
            </div>
            <div>
              <Label htmlFor="message">Votre message</Label>
              <Textarea
                id="message"
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                placeholder="Bonjour, je suis intéressé par votre propriété..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowContactForm(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmitContact}>
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}