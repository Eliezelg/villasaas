'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { debounce } from 'lodash';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin,
  CreditCard,
  CheckCircle2,
  Star,
  Zap,
  Loader2,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

// Schémas de validation pour chaque étape
const step1Schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(50),
  lastName: z.string().min(1, 'Le nom est requis').max(50),
  phone: z.string().optional(),
  address: z.string().min(1, 'L\'adresse est requise'),
  city: z.string().min(1, 'La ville est requise'),
  postalCode: z.string().min(1, 'Le code postal est requis'),
  country: z.string().default('FR'),
  subdomain: z.string()
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(30, 'Le sous-domaine doit contenir au maximum 30 caractères')
    .regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement')
    .regex(/^[a-z0-9]/, 'Doit commencer par une lettre ou un chiffre')
    .regex(/[a-z0-9]$/, 'Doit se terminer par une lettre ou un chiffre'),
});

const step3Schema = z.object({
  plan: z.enum(['starter', 'standard', 'enterprise']),
  paymentMethodId: z.string().optional(),
});


// Type pour toutes les données du formulaire
type SignupFormData = z.infer<typeof step1Schema> & 
  z.infer<typeof step2Schema> & 
  z.infer<typeof step3Schema>;

// Types pour les réponses API
interface SessionResponse {
  sessionToken: string;
  currentStep: number;
  email: string;
}

interface SubscriptionResponse {
  url: string;
}

interface CompleteResponse {
  user: any;
  tenant: any;
}

const STEPS = [
  { id: 'account', title: 'Compte', icon: Mail },
  { id: 'personal', title: 'Informations', icon: User },
  { id: 'subscription', title: 'Abonnement', icon: CreditCard },
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 40,
    features: [
      '1 propriété incluse',
      'Site de réservation personnalisé',
      'Gestion des réservations',
      'Calendrier de disponibilité',
      'Support par email',
    ],
    recommended: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 80,
    features: [
      '3 propriétés incluses',
      'Tout du plan Starter',
      'Synchronisation iCal',
      'Statistiques avancées',
      'Support prioritaire',
      '+15$ par propriété supplémentaire',
    ],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: null,
    features: [
      'Propriétés illimitées',
      'Tout du plan Standard',
      'API personnalisée',
      'Formation dédiée',
      'Support téléphonique 24/7',
      'Fonctionnalités sur mesure',
    ],
    recommended: false,
  },
];

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { toast } = useToast();
  const { setUser, setTenant } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<SignupFormData>>({
    plan: 'starter',
    domainType: 'subdomain',
    country: 'FR',
    subdomain: '',
  });
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    suggestions: string[];
  }>({
    checking: false,
    available: null,
    suggestions: [],
  });

  // Récupérer le token de session et le step depuis l'URL
  useEffect(() => {
    const token = searchParams?.get('token');
    const step = searchParams?.get('step');
    const stripeSessionId = searchParams?.get('session_id');

    if (token) {
      setSessionToken(token);
      
      // Récupérer les infos de la session
      apiClient.get(`/api/auth/signup/session/${token}`)
        .then(response => {
          if (response.data) {
            const session = response.data;
            
            // Restaurer les données du formulaire
            setFormData({
              email: session.email,
              firstName: session.firstName || '',
              lastName: session.lastName || '',
              phone: session.phone || '',
              address: session.address || '',
              city: session.city || '',
              postalCode: session.postalCode || '',
              country: session.country || 'FR',
              plan: session.selectedPlan || 'starter',
              domainType: 'subdomain',
            });

            // Mettre à jour les formulaires avec les données existantes
            if (session.email) {
              step1Form.setValue('email', session.email);
            }
            if (session.firstName) {
              step2Form.setValue('firstName', session.firstName);
              step2Form.setValue('lastName', session.lastName || '');
              step2Form.setValue('phone', session.phone || '');
              step2Form.setValue('address', session.address || '');
              step2Form.setValue('city', session.city || '');
              step2Form.setValue('postalCode', session.postalCode || '');
              step2Form.setValue('country', session.country || 'FR');
            }
            if (session.selectedPlan) {
              step3Form.setValue('plan', session.selectedPlan);
            }

            // Définir l'étape actuelle
            if (step) {
              setCurrentStep(parseInt(step) - 1);
            } else {
              setCurrentStep(session.currentStep || 0);
            }
          }
        })
        .catch(error => {
          console.error('Failed to load session:', error);
          // Session expirée ou invalide, continuer sans
          if (step) {
            setCurrentStep(parseInt(step) - 1);
          }
        });
    } else if (step) {
      setCurrentStep(parseInt(step) - 1);
    }

    // Si on revient de Stripe avec une session_id, mettre à jour la session
    if (stripeSessionId && token) {
      apiClient.post('/api/auth/signup/select-plan', {
        sessionToken: token,
        plan: formData.plan || 'starter',
        stripeSessionId,
      });
    }
  }, [searchParams]);

  // Fonction pour vérifier la disponibilité du sous-domaine
  const checkSubdomainAvailability = useCallback(
    debounce(async (subdomain: string) => {
      if (!subdomain || subdomain.length < 3) {
        setSubdomainStatus({ checking: false, available: null, suggestions: [] });
        return;
      }

      setSubdomainStatus(prev => ({ ...prev, checking: true }));

      try {
        const response = await apiClient.post('/api/public/subdomain/check', {
          subdomain,
        });

        if (response.data) {
          setSubdomainStatus({
            checking: false,
            available: response.data.available,
            suggestions: response.data.suggestions || [],
          });
        }
      } catch (error) {
        console.error('Subdomain check error:', error);
        setSubdomainStatus({ checking: false, available: null, suggestions: [] });
      }
    }, 500),
    []
  );

  // Formulaires pour chaque étape
  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      email: formData.email || '',
      password: formData.password || '',
      confirmPassword: formData.confirmPassword || '',
    },
  });

  const step2Form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      phone: formData.phone || '',
      address: formData.address || '',
      city: formData.city || '',
      postalCode: formData.postalCode || '',
      country: formData.country || 'FR',
      subdomain: formData.subdomain || '',
    },
  });

  const step3Form = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      plan: formData.plan || 'starter',
    },
  });



  // Étape 1: Créer une session de signup
  const handleStep1 = async (data: z.infer<typeof step1Schema>) => {
    setIsLoading(true);
    try {
      // Créer une session temporaire
      const response = await apiClient.post<SessionResponse>('/api/auth/signup/session', {
        email: data.email,
        password: data.password,
      });

      if (response.error) {
        // Gérer spécifiquement l'erreur d'email déjà utilisé
        if (response.error.error === 'Email already exists' || response.error.message === 'Cet email est déjà utilisé') {
          toast({
            title: "Email déjà utilisé",
            description: "Cet email est déjà associé à un compte. Veuillez vous connecter ou utiliser un autre email.",
            variant: "destructive",
            action: (
              <Link href={`/${locale}/admin/login`}>
                <Button variant="outline" size="sm">
                  Se connecter
                </Button>
              </Link>
            ),
          });
        } else {
          toast({
            title: "Erreur",
            description: response.error.message || "Impossible de créer la session",
            variant: "destructive",
          });
        }
        return;
      }

      // Sauvegarder le token de session
      if (response.data) {
        setSessionToken(response.data.sessionToken);
        
        // Mettre à jour formData
        setFormData({ ...formData, ...data });
        setCurrentStep(1);
        
        toast({
          title: "Première étape complétée !",
          description: "Continuons avec vos informations personnelles",
        });
      }
    } catch (error) {
      console.error('Session creation error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2: Mettre à jour les informations personnelles
  const handleStep2 = async (data: z.infer<typeof step2Schema>) => {
    setIsLoading(true);
    try {
      if (!sessionToken) {
        toast({
          title: "Erreur",
          description: "Session invalide",
          variant: "destructive",
        });
        return;
      }

      // Mettre à jour la session avec les informations personnelles
      const response = await apiClient.post('/api/auth/signup/personal-info', {
        sessionToken,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        subdomain: data.subdomain,
      });

      if (response.error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder vos informations",
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, ...data });
      setCurrentStep(2);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 3: Gérer l'abonnement et le paiement
  const handleStep3 = async (data: z.infer<typeof step3Schema>) => {
    setIsLoading(true);
    try {
      if (data.plan === 'enterprise') {
        // Rediriger vers une page de contact
        toast({
          title: "Plan Entreprise",
          description: "Notre équipe va vous contacter pour discuter de vos besoins",
        });
        setFormData({ ...formData, ...data });
        setCurrentStep(3);
        return;
      }

      // Sauvegarder le plan sélectionné
      const planResponse = await apiClient.post('/api/auth/signup/select-plan', {
        sessionToken,
        plan: data.plan,
      });

      if (planResponse.error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder le plan",
          variant: "destructive",
        });
        return;
      }

      // Pour les plans payants, créer une session Stripe Checkout
      const selectedPlan = PLANS.find(p => p.id === data.plan);
      // Utiliser l'URL actuelle du navigateur pour les redirections
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      const response = await apiClient.post<SubscriptionResponse>('/api/subscriptions/signup-checkout', {
        plan: data.plan,
        email: formData.email || '',
        successUrl: `${baseUrl}/${locale}/admin/signup?session_id={CHECKOUT_SESSION_ID}&token=${sessionToken}`,
        cancelUrl: `${baseUrl}/${locale}/admin/signup?step=3&token=${sessionToken}`,
      });

      if (response.error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer la session de paiement",
          variant: "destructive",
        });
        return;
      }

      // Sauvegarder les données avant la redirection
      setFormData({ ...formData, ...data });
      
      // Rediriger vers Stripe Checkout
      if (response.data) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Erreur", 
        description: "Une erreur est survenue avec le paiement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Gestion de la navigation
  const handleNext = async () => {
    switch (currentStep) {
      case 0:
        await step1Form.handleSubmit(handleStep1)();
        break;
      case 1:
        await step2Form.handleSubmit(handleStep2)();
        break;
      case 2:
        await step3Form.handleSubmit(handleStep3)();
        break;
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Vérifier si on revient de Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const token = searchParams.get('token');
    
    if (sessionId && token) {
      // Finaliser la création du compte après le paiement
      setIsProcessingPayment(true);
      handlePaymentComplete();
    }
  }, [searchParams]);
  
  // Finaliser la création du compte après le paiement
  const handlePaymentComplete = async () => {
    setIsLoading(true);
    try {
      const token = searchParams.get('token');
      if (!token) return;

      // Créer le compte après vérification du paiement
      const response = await apiClient.post<CompleteResponse>('/api/auth/signup/complete', {
        sessionToken: token,
      });

      if (response.error) {
        toast({
          title: "Erreur",
          description: response.error.message || "Impossible de finaliser l'inscription",
          variant: "destructive",
        });
        return;
      }

      if (response.data) {
        // Mettre à jour le store avec les nouvelles données
        setUser(response.data.user);
        setTenant(response.data.tenant);

        toast({
          title: "Bienvenue dans Villa SaaS !",
          description: "Votre compte a été créé avec succès",
        });

        // Rediriger vers la page de confirmation
        router.push(`/${locale}/admin/signup/confirmation`);
      }
    } catch (error) {
      console.error('Payment completion error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la finalisation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un écran de chargement pendant le traitement du paiement
  if (isProcessingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl mx-4">
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Finalisation de votre inscription...</h2>
            <p className="text-gray-600">
              Nous vérifions votre paiement et créons votre compte.
              <br />
              Cela ne prendra que quelques instants.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span>Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Villa SaaS</h1>
          </div>
          <Link href={`/${locale}/admin/login`} className="text-gray-600 hover:text-gray-900">
            Se connecter
          </Link>
        </div>
      </header>

      <main className="px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : isCompleted
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <span className={`text-sm mt-2 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
              <div
                className="absolute top-6 left-0 h-0.5 bg-purple-600 transition-all -z-10"
                style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                {currentStep === 0 && "Créez votre compte"}
                {currentStep === 1 && "Vos informations personnelles"}
                {currentStep === 2 && "Choisissez votre abonnement"}
              </CardTitle>
              <CardDescription>
                {currentStep === 0 && "Commencez avec votre email et mot de passe"}
                {currentStep === 1 && "Ces informations nous permettront de personnaliser votre expérience"}
                {currentStep === 2 && "Sélectionnez le plan qui correspond à vos besoins"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Account Creation */}
              {currentStep === 0 && (
                <Form {...step1Form}>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <FormField
                      control={step1Form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                              <Input
                                type="email"
                                placeholder="vous@example.com"
                                className="pl-10"
                                {...field}
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step1Form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="pl-10"
                                {...field}
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Au moins 8 caractères, une majuscule et un chiffre
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step1Form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="pl-10"
                                {...field}
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}

              {/* Step 2: Personal Information */}
              {currentStep === 1 && (
                <Form {...step2Form}>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={step2Form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step2Form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={step2Form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone (optionnel)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                              <Input
                                type="tel"
                                placeholder="+33 6 12 34 56 78"
                                className="pl-10"
                                {...field}
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step2Form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="123 rue de la Paix"
                                className="pl-10"
                                {...field}
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={step2Form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step2Form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code postal</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={step2Form.control}
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sous-domaine de votre site</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Input 
                                  {...field} 
                                  disabled={isLoading}
                                  placeholder="monsite"
                                  className={`pr-10 ${
                                    subdomainStatus.available === false ? 'border-red-500' : 
                                    subdomainStatus.available === true ? 'border-green-500' : ''
                                  }`}
                                  onChange={(e) => {
                                    // Forcer en minuscules et nettoyer
                                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                    field.onChange(value);
                                    // Vérifier la disponibilité
                                    checkSubdomainAvailability(value);
                                  }}
                                />
                                {subdomainStatus.checking && (
                                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                                )}
                                {!subdomainStatus.checking && subdomainStatus.available === true && field.value && (
                                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                                )}
                                {!subdomainStatus.checking && subdomainStatus.available === false && (
                                  <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <span className="text-gray-500">.webpro200.com</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            {subdomainStatus.available === false ? (
                              <span className="text-red-500">
                                Ce sous-domaine n'est pas disponible
                              </span>
                            ) : subdomainStatus.available === true ? (
                              <span className="text-green-500">
                                Ce sous-domaine est disponible !
                              </span>
                            ) : (
                              'Choisissez l\'adresse de votre site de réservation'
                            )}
                          </FormDescription>
                          {subdomainStatus.suggestions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 mb-1">Suggestions disponibles :</p>
                              <div className="flex flex-wrap gap-2">
                                {subdomainStatus.suggestions.map((suggestion) => (
                                  <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => {
                                      field.onChange(suggestion);
                                      checkSubdomainAvailability(suggestion);
                                    }}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}

              {/* Step 3: Subscription */}
              {currentStep === 2 && (
                <Form {...step3Form}>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <FormField
                      control={step3Form.control}
                      name="plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="space-y-4"
                            >
                              {PLANS.map((plan) => (
                                <label
                                  key={plan.id}
                                  htmlFor={plan.id}
                                  className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${
                                    field.value === plan.id
                                      ? 'border-purple-600 bg-purple-50'
                                      : 'border-gray-200'
                                  }`}
                                >
                                  <RadioGroupItem
                                    value={plan.id}
                                    id={plan.id}
                                    className="mt-1"
                                  />
                                  <div className="ml-4 flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                                        {plan.recommended && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                            <Star className="h-3 w-3" />
                                            Recommandé
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        {plan.price ? (
                                          <>
                                            <span className="text-2xl font-bold">${plan.price}</span>
                                            <span className="text-gray-500">/mois</span>
                                          </>
                                        ) : (
                                          <span className="text-lg font-medium text-gray-700">Sur devis</span>
                                        )}
                                      </div>
                                    </div>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                      {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                          <span>{feature}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {step3Form.watch('plan') !== 'enterprise' && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Paiement sécurisé via Stripe</strong><br />
                          Vous serez redirigé vers une page de paiement sécurisée.
                          Votre abonnement sera activé immédiatement après le paiement.
                        </p>
                      </div>
                    )}
                  </form>
                </Form>
              )}


              {/* Actions */}
              <div className="flex justify-between mt-8">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  disabled={isLoading || (currentStep === 1 && subdomainStatus.available === false)}
                  className={currentStep === 0 ? 'ml-auto' : ''}
                >
                  {isLoading ? (
                    'Chargement...'
                  ) : currentStep === 2 && step3Form.watch('plan') !== 'enterprise' ? (
                    <>
                      Procéder au paiement
                      <CreditCard className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Continuer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <p className="text-center text-sm text-gray-500 mt-6">
            En continuant, vous acceptez nos{' '}
            <Link href="/terms" className="text-purple-600 hover:underline">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/privacy" className="text-purple-600 hover:underline">
              politique de confidentialité
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}