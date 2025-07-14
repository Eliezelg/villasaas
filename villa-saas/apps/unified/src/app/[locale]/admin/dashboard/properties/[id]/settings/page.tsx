'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Building2, 
  MapPin, 
  Home,
  Save,
  Info,
  Euro,
  Globe,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
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

// Schéma de validation complet
const propertySchema = z.object({
  // Informations de base
  name: z.string().min(1, 'Le nom est requis'),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LOFT', 'CHALET', 'BUNGALOW', 'MOBILE_HOME', 'BOAT', 'OTHER']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  
  // Localisation
  address: z.string().min(1, 'L\'adresse est requise'),
  city: z.string().min(1, 'La ville est requise'),
  postalCode: z.string().min(1, 'Le code postal est requis'),
  country: z.string().default('FR'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Détails
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  maxGuests: z.number().min(1),
  surfaceArea: z.number().optional(),
  
  // Description multilingue
  description: z.object({
    fr: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
    en: z.string().optional(),
    es: z.string().optional(),
    de: z.string().optional(),
    it: z.string().optional(),
  }),
  
  // Tarification
  basePrice: z.number().min(1),
  weekendPremium: z.number().min(0).optional(),
  cleaningFee: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  minNights: z.number().min(1),
  checkInTime: z.string(),
  checkOutTime: z.string(),
  instantBooking: z.boolean(),
  
  // SEO
  slug: z.string().optional(),
})

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

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
]

export default function PropertySettingsPage() {
  const router = useRouter()
  const params = useParams()
  const locale = useLocale()
  const { toast } = useToast()
  
  const propertyId = params.id as string
  const [isLoading, setIsLoading] = useState(false)
  const [property, setProperty] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('basic')
  
  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      propertyType: 'VILLA',
      status: 'DRAFT',
      address: '',
      city: '',
      postalCode: '',
      country: 'FR',
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      description: {
        fr: '',
      },
      basePrice: 100,
      minNights: 1,
      checkInTime: '16:00',
      checkOutTime: '11:00',
      instantBooking: false,
    }
  })
  
  // Charger les données de la propriété
  useEffect(() => {
    const loadProperty = async () => {
      try {
        const { data } = await apiClient.get(`/api/properties/${propertyId}`)
        if (data) {
          setProperty(data)
          // Mettre à jour le formulaire avec les données existantes
          form.reset({
            name: data.name || '',
            propertyType: data.propertyType || 'VILLA',
            status: data.status || 'DRAFT',
            address: data.address || '',
            city: data.city || '',
            postalCode: data.postalCode || '',
            country: data.country || 'FR',
            latitude: data.latitude,
            longitude: data.longitude,
            bedrooms: data.bedrooms || 0,
            bathrooms: data.bathrooms || 0,
            maxGuests: data.maxGuests || 1,
            surfaceArea: data.surfaceArea,
            description: data.description || { fr: '' },
            basePrice: data.basePrice || 100,
            weekendPremium: data.weekendPremium || 0,
            cleaningFee: data.cleaningFee || 0,
            securityDeposit: data.securityDeposit || 0,
            minNights: data.minNights || 1,
            checkInTime: data.checkInTime || '16:00',
            checkOutTime: data.checkOutTime || '11:00',
            instantBooking: data.instantBooking || false,
            slug: data.slug,
          })
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger la propriété",
          variant: "destructive",
        })
      }
    }
    
    loadProperty()
  }, [propertyId, form, toast])
  
  // Sauvegarder les modifications
  const onSubmit = async (data: z.infer<typeof propertySchema>) => {
    setIsLoading(true)
    try {
      const response = await apiClient.patch(`/api/properties/${propertyId}`, data)
      
      if (response.error) {
        toast({
          title: "Erreur",
          description: response.error.message || "Impossible de sauvegarder",
          variant: "destructive",
        })
        return
      }
      
      toast({
        title: "Modifications enregistrées",
        description: "Les informations de votre propriété ont été mises à jour",
      })
      
      // Recharger les données
      if (response.data) {
        setProperty(response.data)
      }
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
  
  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres de la propriété</h1>
        <p className="text-muted-foreground">
          Gérez toutes les informations de votre propriété
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">
                <Building2 className="h-4 w-4 mr-2" />
                Général
              </TabsTrigger>
              <TabsTrigger value="location">
                <MapPin className="h-4 w-4 mr-2" />
                Localisation
              </TabsTrigger>
              <TabsTrigger value="details">
                <Info className="h-4 w-4 mr-2" />
                Détails
              </TabsTrigger>
              <TabsTrigger value="pricing">
                <Euro className="h-4 w-4 mr-2" />
                Tarification
              </TabsTrigger>
              <TabsTrigger value="seo">
                <Globe className="h-4 w-4 mr-2" />
                SEO
              </TabsTrigger>
            </TabsList>
            
            {/* Onglet Général */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                  <CardDescription>
                    Les informations de base de votre propriété
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                                <SelectValue />
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
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DRAFT">Brouillon</SelectItem>
                              <SelectItem value="PUBLISHED">Publié</SelectItem>
                              <SelectItem value="ARCHIVED">Archivé</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="instantBooking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Réservation instantanée
                          </FormLabel>
                          <FormDescription>
                            Les clients peuvent réserver sans votre approbation
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Onglet Localisation */}
            <TabsContent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Localisation</CardTitle>
                  <CardDescription>
                    L'adresse et la localisation de votre propriété
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                    
                    <FormField
                      control={form.control}
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
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="FR" />
                        </FormControl>
                        <FormDescription>
                          Code pays ISO (FR, ES, IT, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.000001"
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.000001"
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Onglet Détails */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Détails de la propriété</CardTitle>
                  <CardDescription>
                    Les caractéristiques et la description
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
                      name="surfaceArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surface (m²)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1"
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Description multilingue</Label>
                    <Tabs defaultValue="fr" className="w-full">
                      <TabsList>
                        {LANGUAGES.map((lang) => (
                          <TabsTrigger key={lang.code} value={lang.code}>
                            <span className="mr-1">{lang.flag}</span>
                            {lang.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {LANGUAGES.map((lang) => (
                        <TabsContent key={lang.code} value={lang.code}>
                          <FormField
                            control={form.control}
                            name={`description.${lang.code}` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    rows={6}
                                    placeholder={`Description en ${lang.label.toLowerCase()}...`}
                                  />
                                </FormControl>
                                {lang.code === 'fr' && (
                                  <FormDescription>
                                    Description principale (obligatoire)
                                  </FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Onglet Tarification */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tarification et conditions</CardTitle>
                  <CardDescription>
                    Définissez vos tarifs et conditions de réservation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="basePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix de base par nuit (€)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1"
                              step="0.01"
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weekendPremium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplément weekend (%)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0"
                              max="100"
                              placeholder="20"
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Appliqué les vendredis et samedis
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cleaningFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frais de ménage (€)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0"
                              step="0.01"
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="securityDeposit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caution (€)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0"
                              step="0.01"
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Onglet SEO */}
            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Optimisation SEO</CardTitle>
                  <CardDescription>
                    Améliorez la visibilité de votre propriété
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL personnalisée (slug)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="villa-paradise-nice"
                            pattern="^[a-z0-9-]+$"
                          />
                        </FormControl>
                        <FormDescription>
                          Uniquement lettres minuscules, chiffres et tirets
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">Aperçu de l'URL</h4>
                    <p className="text-sm text-muted-foreground break-all">
                      https://{property?.tenant?.subdomain || 'votredomaine'}.villa-saas.com/properties/{form.watch('slug') || property?.slug || 'villa-paradise'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/dashboard/properties/${propertyId}`)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                "Enregistrement..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}