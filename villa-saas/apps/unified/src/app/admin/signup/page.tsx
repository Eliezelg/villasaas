'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, ArrowRight, Building2, User, Mail, Lock, Phone, Globe, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { AuthResponse } from '@/types/auth';

const tenantRegisterSchema = z.object({
  // Informations entreprise
  companyName: z.string().min(1, 'Le nom de l\'entreprise est requis').max(100),
  subdomain: z.string()
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(63, 'Le sous-domaine ne peut pas dépasser 63 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets')
    .regex(/^[a-z0-9]/, 'Le sous-domaine doit commencer par une lettre ou un chiffre')
    .regex(/[a-z0-9]$/, 'Le sous-domaine doit finir par une lettre ou un chiffre'),
  
  // Informations personnelles
  firstName: z.string().min(1, 'Le prénom est requis').max(50),
  lastName: z.string().min(1, 'Le nom est requis').max(50),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  
  // Mot de passe
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type TenantRegisterFormValues = z.infer<typeof tenantRegisterSchema>;

const STEPS = [
  { id: 'company', title: 'Votre entreprise', icon: Building2 },
  { id: 'personal', title: 'Vos informations', icon: User },
  { id: 'account', title: 'Votre compte', icon: Lock },
];

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const form = useForm<TenantRegisterFormValues>({
    resolver: zodResolver(tenantRegisterSchema),
    defaultValues: {
      companyName: '',
      subdomain: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setIsCheckingSubdomain(true);
    try {
      const { data, error } = await apiClient.get<{ available: boolean }>(`/api/tenants/check-subdomain/${subdomain}`);
      setSubdomainAvailable(data?.available || false);
    } catch (error) {
      setSubdomainAvailable(false);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof TenantRegisterFormValues)[] = [];
    
    switch (currentStep) {
      case 0:
        fieldsToValidate = ['companyName', 'subdomain'];
        break;
      case 1:
        fieldsToValidate = ['firstName', 'lastName', 'email', 'phone'];
        break;
      case 2:
        fieldsToValidate = ['password', 'confirmPassword'];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      if (currentStep === 0 && subdomainAvailable === false) {
        form.setError('subdomain', { message: 'Ce sous-domaine n\'est pas disponible' });
        return;
      }
      
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onSubmit(form.getValues());
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  async function onSubmit(data: TenantRegisterFormValues) {
    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = data;
      
      const { data: response, error } = await apiClient.post<AuthResponse>('/api/tenants/register', registerData);
      
      if (error) {
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue lors de l'inscription",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Compte créé avec succès !",
        description: "Redirection vers votre tableau de bord...",
      });

      // Stocker les tokens
      if (response?.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      // Rediriger vers l'onboarding
      setTimeout(() => {
        router.push('/admin/onboarding');
      }, 2000);

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Villa SaaS</h1>
          </div>
          <Link href="/admin/login" className="text-gray-600 hover:text-gray-900">
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
                {currentStep === 0 && "Créez votre espace de gestion"}
                {currentStep === 1 && "Parlez-nous de vous"}
                {currentStep === 2 && "Sécurisez votre compte"}
              </CardTitle>
              <CardDescription>
                {currentStep === 0 && "Commencez votre essai gratuit de 30 jours"}
                {currentStep === 1 && "Ces informations nous permettront de personnaliser votre expérience"}
                {currentStep === 2 && "Choisissez un mot de passe sécurisé pour protéger votre compte"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                  {/* Step 1: Company Info */}
                  {currentStep === 0 && (
                    <>
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom de votre entreprise</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ma Villa Location"
                                {...field}
                                disabled={isLoading}
                                className="text-lg"
                              />
                            </FormControl>
                            <FormDescription>
                              Ce nom apparaîtra sur votre site de réservation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subdomain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Choisissez votre sous-domaine</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input
                                  placeholder="mavillla"
                                  {...field}
                                  disabled={isLoading}
                                  onChange={(e) => {
                                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                    field.onChange(value);
                                    checkSubdomainAvailability(value);
                                  }}
                                  className="text-lg"
                                />
                              </FormControl>
                              <span className="text-gray-500">.villasaas.com</span>
                            </div>
                            <FormDescription>
                              {isCheckingSubdomain && "Vérification de la disponibilité..."}
                              {!isCheckingSubdomain && subdomainAvailable === true && (
                                <span className="text-green-600">Ce sous-domaine est disponible !</span>
                              )}
                              {!isCheckingSubdomain && subdomainAvailable === false && (
                                <span className="text-red-600">Ce sous-domaine n'est pas disponible</span>
                              )}
                              {!isCheckingSubdomain && subdomainAvailable === null && field.value && (
                                "Votre site sera accessible à cette adresse"
                              )}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Step 2: Personal Info */}
                  {currentStep === 1 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prénom</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Jean"
                                  {...field}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Dupont"
                                  {...field}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email professionnel</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                  type="email"
                                  placeholder="votre@email.com"
                                  {...field}
                                  disabled={isLoading}
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Nous utiliserons cet email pour vous contacter
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
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
                                  {...field}
                                  disabled={isLoading}
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Step 3: Account Security */}
                  {currentStep === 2 && (
                    <>
                      <FormField
                        control={form.control}
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
                                  {...field}
                                  disabled={isLoading}
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Minimum 8 caractères avec une majuscule et un chiffre
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
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
                                  {...field}
                                  disabled={isLoading}
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-medium text-purple-900 mb-2">Votre essai gratuit comprend :</h4>
                        <ul className="space-y-1 text-sm text-purple-700">
                          <li>✓ 30 jours d'accès complet sans engagement</li>
                          <li>✓ Toutes les fonctionnalités premium</li>
                          <li>✓ Support client prioritaire</li>
                          <li>✓ Pas de carte bancaire requise</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 0 || isLoading}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Précédent
                    </Button>

                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isLoading || (currentStep === 0 && subdomainAvailable === false)}
                      className="flex items-center gap-2"
                    >
                      {currentStep === STEPS.length - 1 ? (
                        isLoading ? 'Création du compte...' : 'Créer mon compte'
                      ) : (
                        <>
                          Suivant
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Trust badges */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité</p>
          </div>
        </div>
      </main>
    </div>
  );
}