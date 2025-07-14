'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Globe,
  Check,
  X,
  ShoppingCart,
  ArrowRight,
  Loader2,
  ExternalLink,
  Info,
  Clock,
  CheckCircle2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Badge } from '@/components/ui/badge'

// Schéma de validation
const domainSchema = z.object({
  domainType: z.enum(['subdomain', 'custom', 'purchase']),
  subdomain: z.string()
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(63, 'Le sous-domaine ne peut pas dépasser 63 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets')
    .regex(/^[a-z0-9]/, 'Le sous-domaine doit commencer par une lettre ou un chiffre')
    .regex(/[a-z0-9]$/, 'Le sous-domaine doit finir par une lettre ou un chiffre')
    .optional(),
  customDomain: z.string().optional(),
  purchaseDomain: z.string()
    .regex(/^[a-z0-9-]+\.[a-z]{2,}$/, 'Format de domaine invalide (ex: mavillanice.com)')
    .optional(),
})

export default function PropertyDomainPage() {
  const router = useRouter()
  const params = useParams()
  const locale = useLocale()
  const { toast } = useToast()
  
  const propertyId = params.id as string
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingDomain, setIsCheckingDomain] = useState(false)
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null)
  const [domainPrice, setDomainPrice] = useState<number>(24)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  
  const form = useForm<z.infer<typeof domainSchema>>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      domainType: 'subdomain',
      subdomain: '',
      customDomain: '',
      purchaseDomain: '',
    }
  })
  
  // Charger les données de la propriété
  useEffect(() => {
    const loadProperty = async () => {
      const { data } = await apiClient.get(`/api/properties/${propertyId}`)
      if (data) {
        setProperty(data)
        
        // Déterminer le type de domaine actuel
        if (data.subdomain) {
          form.reset({
            domainType: 'subdomain',
            subdomain: data.subdomain,
            customDomain: '',
            purchaseDomain: '',
          })
        } else if (data.customDomain) {
          form.reset({
            domainType: 'custom',
            subdomain: '',
            customDomain: data.customDomain,
            purchaseDomain: '',
          })
        }
      }
    }
    loadProperty()
    
    // Vérifier si on revient d'un achat réussi
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      setPurchaseSuccess(true)
      toast({
        title: "Domaine acheté avec succès !",
        description: "La configuration DNS peut prendre jusqu'à 48h pour se propager.",
      })
    }
  }, [propertyId, form, toast])
  
  // Vérifier la disponibilité d'un domaine
  const checkDomainAvailability = async () => {
    const domain = form.watch('purchaseDomain')
    if (!domain) return
    
    setIsCheckingDomain(true)
    setDomainAvailable(null)
    
    try {
      const { data } = await apiClient.post('/api/domains/check', { domain })
      if (data) {
        setDomainAvailable(data.available)
        setDomainPrice(data.price || 24)
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier la disponibilité",
        variant: "destructive",
      })
    } finally {
      setIsCheckingDomain(false)
    }
  }
  
  // Sauvegarder les paramètres de domaine
  const onSubmit = async (data: z.infer<typeof domainSchema>) => {
    setIsLoading(true)
    
    try {
      const updateData: any = {}
      
      if (data.domainType === 'subdomain') {
        updateData.subdomain = data.subdomain
        updateData.customDomain = null
      } else if (data.domainType === 'custom') {
        updateData.customDomain = data.customDomain
        updateData.subdomain = null
      } else if (data.domainType === 'purchase') {
        // Pour l'achat, on stocke le domaine souhaité temporairement
        updateData.customDomain = data.purchaseDomain
        updateData.subdomain = null
        updateData.domainPurchasePending = true
      }
      
      const response = await apiClient.patch(`/api/properties/${propertyId}`, updateData)
      
      if (response.error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le domaine",
          variant: "destructive",
        })
        return
      }
      
      // Si c'est un achat de domaine, rediriger vers le paiement
      if (data.domainType === 'purchase' && domainAvailable) {
        const checkoutResponse = await apiClient.post('/api/domains/purchase', {
          domain: data.purchaseDomain,
          propertyId: propertyId,
        })
        
        if (checkoutResponse.data?.url) {
          window.location.href = checkoutResponse.data.url
          return
        }
      }
      
      toast({
        title: "Domaine mis à jour",
        description: "Les paramètres de domaine ont été sauvegardés",
      })
      
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
  
  const currentDomainType = form.watch('domainType')
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion du domaine</h1>
        <p className="text-muted-foreground mt-2">
          Configurez le domaine de votre site de réservation
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Type de domaine</CardTitle>
              <CardDescription>
                Choisissez comment vos visiteurs accéderont à votre site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="domainType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-4"
                      >
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="subdomain" id="subdomain" />
                          <div className="flex-1">
                            <Label htmlFor="subdomain" className="font-medium cursor-pointer">
                              Sous-domaine gratuit
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Utilisez un sous-domaine .villasaas.com gratuit
                            </p>
                          </div>
                          <Badge variant="secondary">Gratuit</Badge>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="custom" id="custom" />
                          <div className="flex-1">
                            <Label htmlFor="custom" className="font-medium cursor-pointer">
                              J'ai déjà mon domaine
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Connectez votre propre domaine existant
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="purchase" id="purchase" />
                          <div className="flex-1">
                            <Label htmlFor="purchase" className="font-medium cursor-pointer">
                              Acheter un nouveau domaine
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Achetez et configurez un nouveau domaine
                            </p>
                          </div>
                          <Badge>24€/an</Badge>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Configuration sous-domaine */}
              {currentDomainType === 'subdomain' && (
                <div className="space-y-4 mt-6">
                  <FormField
                    control={form.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Votre sous-domaine</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="mavillanice"
                              {...field}
                              disabled={isLoading}
                            />
                            <span className="text-muted-foreground">.villasaas.com</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Choisissez un nom court et mémorable
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertTitle>URL de votre site</AlertTitle>
                    <AlertDescription>
                      https://{form.watch('subdomain') || 'mavillanice'}.villasaas.com
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {/* Configuration domaine existant */}
              {currentDomainType === 'custom' && (
                <div className="space-y-4 mt-6">
                  <FormField
                    control={form.control}
                    name="customDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Votre domaine</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="www.mavillanice.com"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Entrez votre nom de domaine complet
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Configuration DNS requise</AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                      <p>Pour connecter votre domaine, ajoutez ces enregistrements DNS :</p>
                      <div className="bg-muted p-3 rounded-md mt-2 font-mono text-sm">
                        <p>Type: CNAME</p>
                        <p>Nom: @ ou www</p>
                        <p>Valeur: {property?.tenant?.subdomain || 'votresubdomain'}.villasaas.com</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {/* Achat de domaine */}
              {currentDomainType === 'purchase' && (
                <div className="space-y-4 mt-6">
                  <FormField
                    control={form.control}
                    name="purchaseDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau domaine</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              placeholder="mavillanice.com"
                              {...field}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={checkDomainAvailability}
                              disabled={!field.value || isCheckingDomain}
                            >
                              {isCheckingDomain ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Vérifier"
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Entrez le domaine souhaité sans www
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {domainAvailable !== null && (
                    <Alert variant={domainAvailable ? "default" : "destructive"}>
                      {domainAvailable ? (
                        <>
                          <Check className="h-4 w-4" />
                          <AlertTitle>Domaine disponible !</AlertTitle>
                          <AlertDescription>
                            <p>{form.watch('purchaseDomain')} est disponible à l'achat</p>
                            <p className="font-semibold mt-1">Prix : {domainPrice}€/an</p>
                          </AlertDescription>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          <AlertTitle>Domaine non disponible</AlertTitle>
                          <AlertDescription>
                            Ce domaine est déjà pris. Essayez une autre variante.
                          </AlertDescription>
                        </>
                      )}
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Statut DNS et Propagation */}
          {property?.customDomain && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Statut du domaine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{property.customDomain}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Domaine personnalisé actif
                      </p>
                    </div>
                    {property.domainPurchasePending ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Configuration en cours
                      </Badge>
                    ) : (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Actif
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Propagation DNS</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <p>La propagation DNS peut prendre jusqu'à 48 heures. Pendant ce temps :</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Votre site reste accessible via le sous-domaine</li>
                      <li>Certains visiteurs verront le nouveau domaine, d'autres l'ancien</li>
                      <li>Les emails peuvent être temporairement affectés</li>
                    </ul>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://dnschecker.org/all-dns-records-of-domain.php?query=${property.customDomain}&rtype=ALL&dns=google`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Vérifier la propagation DNS
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
                
                {/* Redirection automatique */}
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium mb-2">Redirections automatiques</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ces redirections sont configurées automatiquement :
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <code className="bg-background px-2 py-1 rounded">
                        {property.subdomain}.villasaas.com
                      </code>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <code className="bg-background px-2 py-1 rounded">
                        {property.customDomain}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="bg-background px-2 py-1 rounded">
                        www.{property.customDomain}
                      </code>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <code className="bg-background px-2 py-1 rounded">
                        {property.customDomain}
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/dashboard/properties/${propertyId}`)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                (currentDomainType === 'purchase' && (!domainAvailable || !form.watch('purchaseDomain')))
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : currentDomainType === 'purchase' && domainAvailable ? (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Acheter le domaine
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
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