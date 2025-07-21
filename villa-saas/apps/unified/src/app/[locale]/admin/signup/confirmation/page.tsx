'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CheckCircle2, Loader2, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';

export default function SignupConfirmationPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, tenant } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Redirection automatique après 5 secondes
    const timer = setTimeout(() => {
      setIsRedirecting(true);
      router.push(`/${locale}/admin/dashboard/onboarding`);
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, locale]);

  const handleContinue = () => {
    setIsRedirecting(true);
    router.push(`/${locale}/admin/dashboard/onboarding`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Bienvenue dans Villa SaaS !
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Votre compte a été créé avec succès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Entreprise</p>
                <p className="font-medium">{tenant?.name || 'Votre entreprise'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Statut de l'abonnement</p>
                <p className="font-medium text-green-600">Actif</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Prochaines étapes :</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-medium">1.</span>
                <span>Configurez votre première propriété</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">2.</span>
                <span>Personnalisez votre site de réservation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">3.</span>
                <span>Invitez votre équipe à collaborer</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleContinue}
            disabled={isRedirecting}
            className="w-full"
            size="lg"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirection en cours...
              </>
            ) : (
              <>
                Accéder au tableau de bord
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {!isRedirecting && (
            <p className="text-center text-sm text-gray-500">
              Vous serez redirigé automatiquement dans quelques secondes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}