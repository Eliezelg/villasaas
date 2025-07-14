'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CreditCard, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { settingsService } from '@/services/admin/settings.service';

export function StripeSetupBanner() {
  const router = useRouter();
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si la bannière a déjà été fermée
    const dismissed = localStorage.getItem('stripe-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsLoading(false);
      return;
    }

    checkStripeStatus();
  }, []);

  const checkStripeStatus = async () => {
    try {
      const { data } = await settingsService.getStripeConnectStatus();
      
      // Afficher la bannière si Stripe n'est pas configuré ou pas actif
      if (!data || !data.connected || data.status !== 'active') {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      // En cas d'erreur, afficher la bannière par sécurité
      setIsVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('stripe-banner-dismissed', 'true');
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleSetup = () => {
    router.push(`/${locale}/admin/dashboard/settings/payments`);
  };

  if (isLoading || isDismissed || !isVisible) {
    return null;
  }

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-orange-800">
              <strong className="font-semibold">Configuration des paiements requise</strong>
              <p className="mt-1">
                Pour recevoir des paiements de vos clients, vous devez configurer votre compte Stripe.
                Cette étape est essentielle pour activer les réservations en ligne.
              </p>
              <Button
                onClick={handleSetup}
                size="sm"
                className="mt-3"
                variant="default"
              >
                Configurer Stripe maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </AlertDescription>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          size="sm"
          variant="ghost"
          className="text-orange-600 hover:text-orange-700 -mt-1 -mr-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}