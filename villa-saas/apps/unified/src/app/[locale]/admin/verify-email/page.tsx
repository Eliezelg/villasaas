'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    // Si un token est présent dans l'URL, vérifier automatiquement
    if (token) {
      verifyWithToken(token);
    }
  }, [token]);

  const verifyWithToken = async (verificationToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await apiClient.post('/api/auth/verify-email', {
        token: verificationToken,
      });

      if (error) {
        setError(error.message || 'Échec de la vérification');
        return;
      }

      setIsVerified(true);
      toast({
        title: "Email vérifié !",
        description: "Votre compte est maintenant activé",
      });

      // Rediriger vers l'onboarding après 2 secondes
      setTimeout(() => {
        router.push('/admin/onboarding');
      }, 2000);

    } catch (err) {
      setError('Une erreur inattendue est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyWithCode = async () => {
    if (!code || code.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await apiClient.post('/api/auth/verify-email', {
        email,
        code,
      });

      if (error) {
        setError(error.message || 'Code invalide ou expiré');
        return;
      }

      setIsVerified(true);
      toast({
        title: "Email vérifié !",
        description: "Votre compte est maintenant activé",
      });

      // Rediriger vers l'onboarding après 2 secondes
      setTimeout(() => {
        router.push('/admin/onboarding');
      }, 2000);

    } catch (err) {
      setError('Une erreur inattendue est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (!email) {
      setError('Email manquant');
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      const { data, error } = await apiClient.post('/api/auth/resend-verification', {
        email,
      });

      if (error) {
        setError(error.message || 'Impossible de renvoyer le code');
        return;
      }

      toast({
        title: "Code renvoyé",
        description: "Vérifiez votre boîte mail",
      });

    } catch (err) {
      setError('Une erreur inattendue est survenue');
    } finally {
      setIsResending(false);
    }
  };

  // Si déjà vérifié
  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email vérifié !</CardTitle>
            <CardDescription>
              Votre compte est maintenant activé. Redirection en cours...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulaire de vérification
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-10 w-10 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
          <CardDescription>
            {email ? (
              <>Nous avons envoyé un code de vérification à <strong>{email}</strong></>
            ) : (
              'Entrez le code de vérification reçu par email'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 rounded-lg p-3 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <Label htmlFor="code">Code de vérification</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                }}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Entrez le code à 6 chiffres reçu par email
              </p>
            </div>

            <Button
              onClick={verifyWithCode}
              disabled={isLoading || !code}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  Vérifier
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">ou</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={resendCode}
              disabled={isResending || !email}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Renvoyer le code'
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou{' '}
              <button
                onClick={resendCode}
                disabled={isResending}
                className="text-purple-600 hover:underline"
              >
                renvoyez le code
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}