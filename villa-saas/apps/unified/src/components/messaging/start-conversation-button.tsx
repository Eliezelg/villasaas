'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { messagingService } from '@/services/messaging.service';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

interface StartConversationButtonProps {
  propertyId: string;
  propertyName: string;
  bookingId?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function StartConversationButton({
  propertyId,
  propertyName,
  bookingId,
  className,
  variant = 'default',
  size = 'default',
}: StartConversationButtonProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async () => {
    // Validation
    if (!user && (!formData.guestEmail || !formData.guestName)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir votre nom et email",
        variant: "destructive",
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez écrire un message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await messagingService.createConversation({
        propertyId,
        bookingId,
        subject: formData.subject || `Question sur ${propertyName}`,
        message: formData.message,
        guestEmail: !user ? formData.guestEmail : undefined,
        guestName: !user ? formData.guestName : undefined,
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'envoyer le message",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Message envoyé",
        description: "Le propriétaire vous répondra dans les plus brefs délais",
      });

      setIsOpen(false);
      setFormData({
        guestName: '',
        guestEmail: '',
        subject: '',
        message: '',
      });

      // Si l'utilisateur est connecté, rediriger vers la conversation
      if (user && data?.conversation) {
        router.push(`/admin/messages?conversation=${data.conversation.id}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Contacter le propriétaire
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contacter le propriétaire</DialogTitle>
            <DialogDescription>
              Posez vos questions sur {propertyName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!user && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guestName">Votre nom</Label>
                    <Input
                      id="guestName"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      placeholder="Jean Dupont"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guestEmail">Votre email</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                      placeholder="jean@example.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="subject">Sujet (optionnel)</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder={`Question sur ${propertyName}`}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="message">Votre message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Bonjour, j'aimerais avoir plus d'informations sur..."
                rows={4}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.message.trim()}
            >
              {isLoading ? (
                <>Envoi en cours...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}