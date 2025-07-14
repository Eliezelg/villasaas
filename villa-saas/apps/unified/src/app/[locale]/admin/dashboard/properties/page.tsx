'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Building2, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { propertiesService } from '@/services/properties.service'
import { PropertyQuotaCard } from '@/components/admin/properties/property-quota-card'
import type { Property } from '@/types/property'

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: 'Appartement',
  HOUSE: 'Maison',
  VILLA: 'Villa',
  STUDIO: 'Studio',
  LOFT: 'Loft',
  CHALET: 'Chalet',
  BUNGALOW: 'Bungalow',
  MOBILE_HOME: 'Mobil-home',
  BOAT: 'Bateau',
  OTHER: 'Autre',
}

const statusLabels = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' as const },
  PUBLISHED: { label: 'Publié', variant: 'success' as const },
  ARCHIVED: { label: 'Archivé', variant: 'destructive' as const },
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProperties()
  }, [])

  async function loadProperties() {
    setIsLoading(true)
    setError(null)

    const { data, error } = await propertiesService.getAll()

    if (error) {
      setError(error.message || 'Erreur lors du chargement des propriétés')
    } else if (data) {
      setProperties(data)
    }

    setIsLoading(false)
  }

  async function handleToggleStatus(property: Property) {
    const action = property.status === 'PUBLISHED' ? 'unpublish' : 'publish'
    const { error } = await propertiesService[action](property.id)

    if (!error) {
      await loadProperties()
    }
  }

  async function handleDelete(property: Property) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${property.name}" ?`)) {
      return
    }

    const { error } = await propertiesService.delete(property.id)

    if (!error) {
      await loadProperties()
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Propriétés</h1>
            <p className="text-muted-foreground">
              Gérez vos biens immobiliers
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Propriétés</h1>
        <p className="text-muted-foreground">
          Gérez vos biens immobiliers
        </p>
      </div>

      {/* Carte de quota */}
      <div className="mb-6">
        <PropertyQuotaCard />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-lg font-medium">Aucune propriété</p>
            <p className="text-sm text-muted-foreground">
              Utilisez le bouton ci-dessus pour ajouter votre première propriété
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative overflow-hidden">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${property.images[0].url}`}
                    alt={property.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">
                      {property.name}
                    </CardTitle>
                    <CardDescription>
                      {propertyTypeLabels[property.propertyType]} • {property.city}
                    </CardDescription>
                  </div>
                  <Badge variant={statusLabels[property.status].variant}>
                    {statusLabels[property.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Chambres</p>
                    <p className="font-medium">{property.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Personnes</p>
                    <p className="font-medium">{property.maxGuests}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prix/nuit</p>
                    <p className="font-medium">{property.basePrice} €</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link href={`/dashboard/properties/${property.id}`}>
                      <Edit className="mr-2 h-3 w-3" />
                      Modifier
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(property)}
                  >
                    {property.status === 'PUBLISHED' ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(property)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}