'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  ArrowRight, 
  Building2, 
  MapPin, 
  Home,
  Check,
  Upload,
  Info,
  Calendar,
  Euro,
  Users,
  Languages,
  Image as ImageIcon,
  Building,
  Globe
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import { usePropertiesStore } from '@/store/properties.store'

// Schémas de validation pour chaque étape
const propertyCreationSchema = z.object({
  companyName: z.string().min(1, 'Le nom de l\'entreprise est requis').max(100),
  propertyName: z.string().min(1, 'Le nom de la propriété est requis'),
  domainType: z.enum(['subdomain', 'custom', 'purchase']),
  subdomain: z.string()
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(63, 'Le sous-domaine ne peut pas dépasser 63 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets')
    .regex(/^[a-z0-9]/, 'Le sous-domaine doit commencer par une lettre ou un chiffre')
    .regex(/[a-z0-9]$/, 'Le sous-domaine doit finir par une lettre ou un chiffre')
    .optional(),
  customDomain: z.string().optional(),
  purchaseDomain: z.string().optional(),
})

const basicInfoSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LOFT', 'CHALET', 'BUNGALOW', 'MOBILE_HOME', 'BOAT', 'OTHER']),
  address: z.string().min(1, 'L\'adresse est requise'),
  city: z.string().min(1, 'La ville est requise'),
  postalCode: z.string().min(1, 'Le code postal est requis'),
  country: z.string().default('FR'),
})

const detailsSchema = z.object({
  bedrooms: z.number().min(0, 'Le nombre de chambres doit être positif'),
  bathrooms: z.number().min(0, 'Le nombre de salles de bain doit être positif'),
  maxGuests: z.number().min(1, 'La capacité doit être au moins 1'),
  surfaceArea: z.number().min(1, 'La surface doit être positive').optional(),
  description: z.object({
    fr: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
    en: z.string().optional(),
  }),
})

const pricingSchema = z.object({
  basePrice: z.number().min(1, 'Le prix doit être positif'),
  weekendPremium: z.number().min(0).optional(),
  cleaningFee: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  minNights: z.number().min(1, 'Le minimum de nuits doit être au moins 1').default(1),
  checkInTime: z.string().default('16:00'),
  checkOutTime: z.string().default('11:00'),
})

const STEPS = [
  { id: 'creation', title: 'Création', icon: Building },
  { id: 'basic', title: 'Informations de base', icon: Building2 },
  { id: 'details', title: 'Détails & Description', icon: Info },
  { id: 'pricing', title: 'Tarification', icon: Euro },
  { id: 'photos', title: 'Photos', icon: ImageIcon },
]

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'LOFT', label: 'Loft' },
  { value: 'CHALET', label: 'Chalet' },
  { value: 'BUNGALOW', label: 'Bungalow' },
  { value: 'MOBILE_HOME', label: 'Mobil-home' },
  { value: 'BOAT', label: 'Bateau' },
  { value: 'OTHER', label: 'Autre' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const { properties, setProperties } = usePropertiesStore()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  
  // Récupérer l'ID de la propriété depuis sessionStorage ou utiliser la première propriété
  const onboardingPropertyId = typeof window !== 'undefined' ? sessionStorage.getItem('onboarding_property_id') : null
  const property = properties?.find(p => p.id === onboardingPropertyId) || properties?.[0]
  
  const creationForm = useForm<z.infer<typeof propertyCreationSchema>>({
    resolver: zodResolver(propertyCreationSchema),
    defaultValues: {
      companyName: '',
      propertyName: '',
      domainType: 'subdomain',
      subdomain: '',
      customDomain: '',
      purchaseDomain: '',
    }
  })
  
  const basicForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: '',
      propertyType: 'VILLA',
      address: '',
      city: '',
      postalCode: '',
      country: 'FR',
    }
  })
  
  const detailsForm = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      surfaceArea: undefined,
      description: {
        fr: '',
        en: '',
      }
    }
  })
  
  const pricingForm = useForm<z.infer<typeof pricingSchema>>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      basePrice: 100,
      weekendPremium: 0,
      cleaningFee: 0,
      securityDeposit: 0,
      minNights: 1,
      checkInTime: '16:00',
      checkOutTime: '11:00',
    }
  })
  
  // Charger les propriétés au montage (si déjà créée)
  useEffect(() => {
    const loadProperties = async () => {
      // Vérifier s'il y a déjà une propriété d'onboarding en cours
      if (onboardingPropertyId) {
        const { data } = await apiClient.get<any[]>('/api/properties')
        if (data) {
          setProperties(data)
          const targetProperty = data.find(p => p.id === onboardingPropertyId)
          if (targetProperty) {
            setPropertyId(targetProperty.id)
            // Passer directement à l'étape 1 si la propriété existe déjà
            setCurrentStep(1)
            
            // Mettre à jour les valeurs des formulaires avec les données de la propriété
            basicForm.reset({
              name: targetProperty.name || '',
              propertyType: targetProperty.propertyType || 'VILLA',
              address: targetProperty.address || '',
              city: targetProperty.city || '',
              postalCode: targetProperty.postalCode || '',
              country: targetProperty.country || 'FR',
            })
            
            detailsForm.reset({
              bedrooms: targetProperty.bedrooms || 1,
              bathrooms: targetProperty.bathrooms || 1,
              maxGuests: targetProperty.maxGuests || 2,
              surfaceArea: targetProperty.surfaceArea || undefined,
              description: {
                fr: targetProperty.description?.fr || '',
                en: targetProperty.description?.en || '',
              }
            })
            
            pricingForm.reset({
              basePrice: targetProperty.basePrice || 100,
              weekendPremium: targetProperty.weekendPremium || 0,
              cleaningFee: targetProperty.cleaningFee || 0,
              securityDeposit: targetProperty.securityDeposit || 0,
              minNights: targetProperty.minNights || 1,
              checkInTime: targetProperty.checkInTime || '16:00',
              checkOutTime: targetProperty.checkOutTime || '11:00',
            })
          }
        }
      }
    }
    loadProperties()
  }, [onboardingPropertyId, basicForm, detailsForm, pricingForm, setProperties])
  
  // Créer la propriété
  const handlePropertyCreation = async (data: z.infer<typeof propertyCreationSchema>) => {
    setIsLoading(true)
    try {
      // Créer la propriété
      const propertyData = {
        name: data.propertyName,
        companyName: data.companyName,
        status: 'DRAFT',
        subdomain: data.domainType === 'subdomain' ? data.subdomain : undefined,
        customDomain: data.domainType === 'custom' ? data.customDomain : data.domainType === 'purchase' ? data.purchaseDomain : undefined,
      }
      
      const response = await apiClient.post('/api/properties', propertyData)
      
      if (response.error) {
        toast({
          title: "Erreur",
          description: response.error.message || "Impossible de créer la propriété",
          variant: "destructive",
        })
        return
      }
      
      if (response.data) {
        setPropertyId(response.data.id)
        // Sauvegarder l'ID pour la session d'onboarding
        sessionStorage.setItem('onboarding_property_id', response.data.id)
        
        // Mettre à jour le formulaire basic avec le nom de la propriété
        basicForm.setValue('name', data.propertyName)
        
        toast({
          title: "Propriété créée !",
          description: "Continuons avec la configuration",
        })
        
        setCurrentStep(1)
      }
    } catch (error) {
      console.error('Property creation error:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Gérer l'upload d'images
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !propertyId) return
    
    const files = Array.from(event.target.files)
    setIsLoading(true)
    
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('metadata', JSON.stringify({ 
          isMain: uploadedImages.length === 0,
          order: uploadedImages.length 
        }))
        
        const { data, error } = await apiClient.post(
          `/api/properties/${propertyId}/images`,
          formData
        )
        
        if (data) {
          setUploadedImages(prev => [...prev, data.id])
        }
      }
      
      toast({
        title: "Photos uploadées",
        description: `${files.length} photo(s) ajoutée(s) avec succès`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'uploader les photos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Mettre à jour les informations de base
  const handleBasicInfo = async (data: z.infer<typeof basicInfoSchema>) => {
    if (!propertyId) return
    
    setIsLoading(true)
    try {
      const response = await apiClient.patch(`/api/properties/${propertyId}`, data)
      
      if (response.error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour les informations",
          variant: "destructive",
        })
        return
      }
      
      setCurrentStep(2)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Mettre à jour les détails
  const handleDetails = async (data: z.infer<typeof detailsSchema>) => {
    if (!propertyId) return
    
    setIsLoading(true)
    try {
      const response = await apiClient.patch(`/api/properties/${propertyId}`, data)
      
      if (response.error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour les détails",
          variant: "destructive",
        })
        return
      }
      
      setCurrentStep(3)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Mettre à jour la tarification
  const handlePricing = async (data: z.infer<typeof pricingSchema>) => {
    if (!propertyId) return
    
    setIsLoading(true)
    try {
      const response = await apiClient.patch(`/api/properties/${propertyId}`, data)
      
      if (response.error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la tarification",
          variant: "destructive",
        })
        return
      }
      
      setCurrentStep(4)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Finaliser l'onboarding
  const handleComplete = async () => {
    if (!propertyId) return
    
    setIsLoading(true)
    try {
      // Publier la propriété
      await apiClient.patch(`/api/properties/${propertyId}`, {
        status: 'PUBLISHED'
      })
      
      toast({
        title: "Configuration terminée !",
        description: "Votre propriété est maintenant publiée",
      })
      
      // Nettoyer le sessionStorage
      sessionStorage.removeItem('onboarding_property_id')
      
      // Rediriger vers la page de la propriété
      router.push(`/${locale}/admin/dashboard/properties/${propertyId}`)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleNext = async () => {
    switch (currentStep) {
      case 0:
        await basicForm.handleSubmit(handleBasicInfo)()
        break
      case 1:
        await detailsForm.handleSubmit(handleDetails)()
        break
      case 2:
        await pricingForm.handleSubmit(handlePricing)()
        break
      case 3:
        await handleComplete()
        break
    }
  }
  
  const canSkip = currentStep === 3 // Peut passer les photos
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Configurez votre propriété
        </h1>
        <p className="text-muted-foreground">
          Complétez les informations pour publier votre propriété
        </p>
      </div>
      
      {/* Progress */}
      <div className="mb-8">
        <Progress value={(currentStep + 1) / STEPS.length * 100} className="mb-4" />
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center space-x-2 ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`p-2 rounded-full ${
                index < currentStep ? 'bg-primary text-primary-foreground' :
                index === currentStep ? 'bg-primary/20' : 'bg-muted'
              }`}>
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Contenu des étapes */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>
            {currentStep === 0 && "Créez votre propriété et choisissez votre domaine"}
            {currentStep === 1 && "Informations essentielles de votre propriété"}
            {currentStep === 2 && "Détails et description pour les voyageurs"}
            {currentStep === 3 && "Définissez vos tarifs et conditions"}
            {currentStep === 4 && "Ajoutez des photos pour attirer les voyageurs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Étape 0: Création de propriété */}
          {currentStep === 0 && (
            <Form {...creationForm}>
              <form className="space-y-6">
                <FormField
                  control={creationForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de votre entreprise</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            placeholder="Ma Villa Location"
                            className="pl-10"
                            {...field}
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Ce nom apparaîtra sur vos factures et documents
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={creationForm.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de votre propriété</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            placeholder="Villa Belle Vue"
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

                <div className="space-y-4">
                  <Label>Choisissez votre domaine</Label>
                  
                  <FormField
                    control={creationForm.control}
                    name="domainType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="subdomain" id="subdomain" />
                              <Label htmlFor="subdomain" className="font-normal cursor-pointer">
                                Utiliser un sous-domaine gratuit
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="custom" id="custom" />
                              <Label htmlFor="custom" className="font-normal cursor-pointer">
                                J'ai mon propre domaine
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="purchase" id="purchase" />
                              <Label htmlFor="purchase" className="font-normal cursor-pointer">
                                Acheter un nouveau domaine
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {creationForm.watch('domainType') === 'subdomain' && (
                    <FormField
                      control={creationForm.control}
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Globe className="h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="mondomaine"
                                {...field}
                                disabled={isLoading}
                              />
                              <span className="text-gray-500">.villasaas.com</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Choisissez un nom court et mémorable
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {creationForm.watch('domainType') === 'custom' && (
                    <FormField
                      control={creationForm.control}
                      name="customDomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Globe className="h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="www.mavillanice.com"
                                {...field}
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Vous pourrez configurer votre domaine plus tard dans les paramètres
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {creationForm.watch('domainType') === 'purchase' && (
                    <FormField
                      control={creationForm.control}
                      name="purchaseDomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Globe className="h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="mavillanice.com"
                                {...field}
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Domaine à partir de 24€/an. Vérification de disponibilité et achat après inscription.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </form>
            </Form>
          )}
          
          {/* Étape 1: Informations de base */}
          {currentStep === 1 && (
            <Form {...basicForm}>
              <form className="space-y-4">
                <FormField
                  control={basicForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la propriété</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Villa Paradise" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={basicForm.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de propriété</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={basicForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Rue de la Plage" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={basicForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nice" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={basicForm.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="06000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={basicForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="FR" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )}
          
          {/* Étape 2: Détails */}
          {currentStep === 2 && (
            <Form {...detailsForm}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={detailsForm.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chambres</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={detailsForm.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salles de bain</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={detailsForm.control}
                    name="maxGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacité max</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1"
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={detailsForm.control}
                    name="surfaceArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surface (m²)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1"
                            placeholder="120"
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Tabs defaultValue="fr" className="w-full">
                  <TabsList>
                    <TabsTrigger value="fr">Français</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="fr">
                    <FormField
                      control={detailsForm.control}
                      name="description.fr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description en français</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={6}
                              placeholder="Décrivez votre propriété..."
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 10 caractères
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="en">
                    <FormField
                      control={detailsForm.control}
                      name="description.en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description in English (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={6}
                              placeholder="Describe your property..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          )}
          
          {/* Étape 3: Tarification */}
          {currentStep === 3 && (
            <Form {...pricingForm}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={pricingForm.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix de base par nuit (€)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1"
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={pricingForm.control}
                    name="weekendPremium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplément weekend (%)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            placeholder="20"
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={pricingForm.control}
                    name="cleaningFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frais de ménage (€)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={pricingForm.control}
                    name="securityDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caution (€)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={pricingForm.control}
                  name="minNights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre minimum de nuits</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1"
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={pricingForm.control}
                    name="checkInTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure d'arrivée</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={pricingForm.control}
                    name="checkOutTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure de départ</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )}
          
          {/* Étape 4: Photos */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="mb-4">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-primary hover:underline">
                      Cliquez pour uploader
                    </span>{' '}
                    ou glissez-déposez vos photos
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG ou WEBP jusqu'à 10MB
                </p>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {uploadedImages.map((imageId, index) => (
                    <div key={imageId} className="relative aspect-square bg-muted rounded-lg">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Photo principale
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {uploadedImages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Ajoutez au moins une photo pour attirer les voyageurs
                </p>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0 || isLoading}
            >
              Précédent
            </Button>
            
            <div className="space-x-2">
              {canSkip && currentStep < STEPS.length - 1 && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={isLoading}
                >
                  Passer
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={isLoading}
              >
                {isLoading ? (
                  "Chargement..."
                ) : currentStep === STEPS.length - 1 ? (
                  <>
                    Terminer
                    <Check className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}