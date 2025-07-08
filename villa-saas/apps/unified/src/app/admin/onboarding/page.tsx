'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Home, 
  Settings, 
  Palette, 
  CreditCard, 
  Rocket,
  Upload,
  Globe,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenue !',
    description: 'Découvrez comment Villa SaaS va transformer votre activité',
    icon: Sparkles,
  },
  {
    id: 'property',
    title: 'Votre première propriété',
    description: 'Ajoutez votre première location pour commencer',
    icon: Home,
  },
  {
    id: 'customization',
    title: 'Personnalisation',
    description: 'Personnalisez votre site de réservation',
    icon: Palette,
  },
  {
    id: 'payment',
    title: 'Configuration des paiements',
    description: 'Connectez Stripe pour recevoir vos paiements',
    icon: CreditCard,
  },
  {
    id: 'complete',
    title: 'C\'est parti !',
    description: 'Votre espace est prêt',
    icon: Rocket,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, tenant, checkAuth } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [propertyData, setPropertyData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    basePrice: '',
    maxGuests: '',
  });
  const [customization, setCustomization] = useState({
    primaryColor: '#7c3aed',
    logo: null as File | null,
    welcomeMessage: '',
  });

  useEffect(() => {
    // Vérifier l'authentification
    checkAuth().then(() => {
      if (!user || !tenant) {
        router.push('/admin/signup');
      }
    });
  }, [checkAuth, user, tenant, router]);

  const handleNext = async () => {
    if (currentStep === 1) {
      // Créer la première propriété
      await createFirstProperty();
    } else if (currentStep === 2) {
      // Sauvegarder la personnalisation
      await saveCustomization();
    } else if (currentStep === 3) {
      // Rediriger vers Stripe Connect
      await setupStripeConnect();
    } else if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Terminer l'onboarding
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const createFirstProperty = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await apiClient.post('/api/properties', {
        name: propertyData.name || 'Ma première propriété',
        description: propertyData.description || 'Une magnifique propriété',
        type: 'VILLA',
        status: 'DRAFT',
        address: propertyData.address,
        city: propertyData.city,
        postalCode: propertyData.postalCode,
        country: 'FR',
        basePrice: parseFloat(propertyData.basePrice) || 100,
        currency: 'EUR',
        maxGuests: parseInt(propertyData.maxGuests) || 4,
        bedrooms: 2,
        bathrooms: 1,
        surfaceArea: 80,
      });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer la propriété",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Propriété créée !",
        description: "Vous pourrez la compléter plus tard",
      });

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomization = async () => {
    setIsLoading(true);
    try {
      // Sauvegarder les paramètres de personnalisation
      const { error } = await apiClient.patch('/api/tenants/current', {
        settings: {
          ...tenant?.settings,
          branding: {
            primaryColor: customization.primaryColor,
            welcomeMessage: customization.welcomeMessage,
          },
        },
      });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder la personnalisation",
          variant: "destructive",
        });
        return;
      }

      // Upload du logo si présent
      if (customization.logo) {
        const formData = new FormData();
        formData.append('logo', customization.logo);
        
        await apiClient.post('/api/tenants/current/logo', formData);
      }

      toast({
        title: "Personnalisation sauvegardée !",
        description: "Votre site a été mis à jour",
      });

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupStripeConnect = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await apiClient.post<{ url: string }>('/api/stripe/connect/onboarding');

      if (error || !data?.url) {
        toast({
          title: "Erreur",
          description: "Impossible de configurer Stripe",
          variant: "destructive",
        });
        return;
      }

      // Rediriger vers Stripe Connect
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      // Permettre de passer cette étape en cas d'erreur
      setCurrentStep(currentStep + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    // Marquer l'onboarding comme terminé
    await apiClient.patch('/api/users/me', {
      onboardingCompleted: true,
    });

    toast({
      title: "Bienvenue dans Villa SaaS !",
      description: "Votre espace est maintenant configuré",
    });

    // Rediriger vers le dashboard
    router.push('/admin/dashboard');
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < ONBOARDING_STEPS.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    index <= currentStep
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      index < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="h-10 w-10 text-purple-600" />
            </div>
            <CardTitle className="text-3xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-lg">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Welcome Step */}
            {currentStep === 0 && (
              <div className="space-y-6 text-center">
                <p className="text-gray-600">
                  Bonjour {user?.firstName} ! Nous sommes ravis de vous accueillir sur Villa SaaS.
                </p>
                <div className="bg-purple-50 rounded-lg p-6 text-left">
                  <h3 className="font-semibold text-purple-900 mb-3">
                    Dans les prochaines étapes, nous allons :
                  </h3>
                  <ul className="space-y-2 text-purple-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Créer votre première propriété</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Personnaliser votre site de réservation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Configurer les paiements en ligne</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Vous montrer comment utiliser le dashboard</span>
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500">
                  Cela ne prendra que quelques minutes !
                </p>
              </div>
            )}

            {/* Property Step */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom de la propriété</Label>
                    <Input
                      id="name"
                      placeholder="Villa Belle Vue"
                      value={propertyData.name}
                      onChange={(e) => setPropertyData({ ...propertyData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="basePrice">Prix par nuit (€)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      placeholder="150"
                      value={propertyData.basePrice}
                      onChange={(e) => setPropertyData({ ...propertyData, basePrice: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre propriété..."
                    rows={3}
                    value={propertyData.description}
                    onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      placeholder="Nice"
                      value={propertyData.city}
                      onChange={(e) => setPropertyData({ ...propertyData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxGuests">Nombre de voyageurs max</Label>
                    <Input
                      id="maxGuests"
                      type="number"
                      placeholder="6"
                      value={propertyData.maxGuests}
                      onChange={(e) => setPropertyData({ ...propertyData, maxGuests: e.target.value })}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  Ne vous inquiétez pas, vous pourrez compléter et modifier ces informations plus tard.
                </p>
              </div>
            )}

            {/* Customization Step */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label>Logo de votre entreprise</Label>
                  <div className="mt-2">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCustomization({ ...customization, logo: file });
                          }
                        }}
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 cursor-pointer transition">
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Cliquez pour télécharger votre logo
                        </p>
                        {customization.logo && (
                          <p className="text-sm text-purple-600 mt-2">
                            {customization.logo.name}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="primaryColor">Couleur principale</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-gray-600">
                      Cette couleur sera utilisée sur votre site de réservation
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="welcomeMessage">Message de bienvenue</Label>
                  <Textarea
                    id="welcomeMessage"
                    placeholder="Bienvenue sur notre site de réservation..."
                    rows={3}
                    value={customization.welcomeMessage}
                    onChange={(e) => setCustomization({ ...customization, welcomeMessage: e.target.value })}
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
                  <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Votre site est accessible à :
                    </p>
                    <p className="text-sm text-blue-700">
                      https://{tenant?.subdomain}.villasaas.com
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Step */}
            {currentStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="bg-green-50 rounded-lg p-6">
                  <CreditCard className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 mb-2">
                    Recevez vos paiements en toute sécurité
                  </h3>
                  <p className="text-green-700 text-sm">
                    Connectez votre compte Stripe pour recevoir les paiements de vos clients directement sur votre compte bancaire.
                  </p>
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Paiements sécurisés</p>
                      <p className="text-sm text-gray-600">
                        Stripe est la solution de paiement la plus sécurisée au monde
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Commission transparente</p>
                      <p className="text-sm text-gray-600">
                        Seulement 3% de commission sur chaque réservation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Virements automatiques</p>
                      <p className="text-sm text-gray-600">
                        Recevez vos fonds sous 2-3 jours ouvrés
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Vous pourrez configurer Stripe plus tard depuis votre dashboard
                </p>
              </div>
            )}

            {/* Complete Step */}
            {currentStep === 4 && (
              <div className="space-y-6 text-center">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-8">
                  <Rocket className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Félicitations {user?.firstName} ! 🎉
                  </h3>
                  <p className="text-gray-700">
                    Votre espace Villa SaaS est maintenant configuré et prêt à l'emploi.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Prochaines étapes recommandées :</h4>
                  <div className="text-left space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 font-semibold">1.</span>
                      <div>
                        <p className="font-medium">Complétez votre première propriété</p>
                        <p className="text-sm text-gray-600">
                          Ajoutez des photos, des équipements et des tarifs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 font-semibold">2.</span>
                      <div>
                        <p className="font-medium">Configurez vos disponibilités</p>
                        <p className="text-sm text-gray-600">
                          Définissez quand votre propriété est disponible à la location
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 font-semibold">3.</span>
                      <div>
                        <p className="font-medium">Publiez votre site</p>
                        <p className="text-sm text-gray-600">
                          Activez votre site pour commencer à recevoir des réservations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-8">
              {currentStep > 0 && currentStep < 4 && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Passer cette étape
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className={currentStep === 0 ? 'ml-auto' : ''}
              >
                {isLoading ? (
                  'Chargement...'
                ) : currentStep === 4 ? (
                  'Accéder au dashboard'
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
      </div>
    </div>
  );
}