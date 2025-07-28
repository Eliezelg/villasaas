'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
  Globe, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Loader2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

const domainSchema = z.object({
  domain: z.string()
    .min(1, 'Le domaine est requis')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/, 'Format de domaine invalide')
})

type DomainFormValues = z.infer<typeof domainSchema>

interface PublicSite {
  id: string
  domain: string | null
  subdomain: string | null
  isActive: boolean
  createdAt: string
}

export default function DomainsPage() {
  const params = useParams()
  const locale = params.locale as string
  const { toast } = useToast()
  
  const [publicSite, setPublicSite] = useState<PublicSite | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDnsInstructions, setShowDnsInstructions] = useState(false)
  const [domainStatus, setDomainStatus] = useState<{
    configured: boolean
    verified: boolean
    dns: Array<{ type: string; name: string; value: string }>
    error?: string
  } | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  
  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      domain: ''
    }
  })

  // Charger les informations du site public
  useEffect(() => {
    loadPublicSite()
  }, [])
  
  // Vérifier le statut du domaine après chargement
  useEffect(() => {
    if (publicSite?.domain) {
      checkDomainStatus(publicSite.domain)
    }
  }, [publicSite?.domain])

  const loadPublicSite = async () => {
    try {
      const { data, error } = await apiClient.get<PublicSite>('/api/public-site')
      if (error) throw error
      
      setPublicSite(data)
      if (data?.domain) {
        form.setValue('domain', data.domain)
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du domaine",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkDomainStatus = async (domain: string) => {
    setIsCheckingStatus(true)
    try {
      const { data, error } = await apiClient.get<{
        configured: boolean
        verified: boolean
        dns: Array<{ type: string; name: string; value: string }>
        error?: string
      }>(`/api/public-site/domain-status?domain=${encodeURIComponent(domain)}`)
      
      if (error) throw error
      setDomainStatus(data)
    } catch (error) {
      console.error('Failed to check domain status:', error)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const onSubmit = async (values: DomainFormValues) => {
    setIsSaving(true)
    try {
      const { error } = await apiClient.patch('/api/public-site', {
        domain: values.domain
      })
      
      if (error) throw error
      
      toast({
        title: "Domaine mis à jour",
        description: "Votre domaine personnalisé a été configuré avec succès"
      })
      
      setShowDnsInstructions(true)
      loadPublicSite()
      
      // Vérifier le statut du domaine après ajout
      setTimeout(() => checkDomainStatus(values.domain), 2000)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le domaine",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copié !",
      description: "L'information a été copiée dans le presse-papier"
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des domaines</h1>
        <p className="text-muted-foreground">
          Configurez votre domaine personnalisé pour votre site de réservation
        </p>
      </div>

      {/* Domaine actuel */}
      <Card>
        <CardHeader>
          <CardTitle>Domaines actuels</CardTitle>
          <CardDescription>
            Vos visiteurs peuvent accéder à votre site via ces adresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sous-domaine gratuit */}
          {publicSite?.subdomain && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{publicSite.subdomain}.villasaas.com</p>
                  <p className="text-sm text-muted-foreground">Sous-domaine gratuit</p>
                </div>
              </div>
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Actif
              </Badge>
            </div>
          )}

          {/* Domaine personnalisé */}
          {publicSite?.domain && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{publicSite.domain}</p>
                  <p className="text-sm text-muted-foreground">Domaine personnalisé</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {domainStatus ? (
                  domainStatus.verified ? (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Configuration DNS en attente
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Vérification...
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://${publicSite.domain}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {!domainStatus?.verified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => checkDomainStatus(publicSite.domain!)}
                    disabled={isCheckingStatus}
                  >
                    {isCheckingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Vérifier'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ajouter/Modifier domaine personnalisé */}
      <Card>
        <CardHeader>
          <CardTitle>
            {publicSite?.domain ? 'Modifier' : 'Ajouter'} un domaine personnalisé
          </CardTitle>
          <CardDescription>
            Utilisez votre propre nom de domaine pour votre site de réservation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de domaine</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="www.mondomaine.com"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormDescription>
                      Entrez votre nom de domaine complet (avec www si souhaité)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {publicSite?.domain ? 'Mettre à jour' : 'Ajouter'} le domaine
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Instructions DNS */}
      {(showDnsInstructions || publicSite?.domain) && domainStatus && !domainStatus.verified && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration DNS requise</AlertTitle>
          <AlertDescription className="space-y-4 mt-4">
            <p>
              Pour que votre domaine fonctionne correctement, vous devez configurer les enregistrements DNS suivants :
            </p>
            
            <div className="space-y-3">
              {domainStatus.dns && domainStatus.dns.length > 0 ? (
                domainStatus.dns.map((record, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm">Type: {record.type}</p>
                        <p className="font-mono text-sm">Nom: {record.name}</p>
                        <p className="font-mono text-sm">Valeur: {record.value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(record.value)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm">Type: A</p>
                        <p className="font-mono text-sm">Nom: @</p>
                        <p className="font-mono text-sm">Valeur: 76.76.21.21</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('76.76.21.21')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm">Type: CNAME</p>
                        <p className="font-mono text-sm">Nom: www</p>
                        <p className="font-mono text-sm">Valeur: cname.vercel-dns.com</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('cname.vercel-dns.com')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <p className="text-sm">
              La propagation DNS peut prendre de 5 minutes à 48 heures. 
              Une fois configuré, votre site sera accessible via votre domaine personnalisé.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}