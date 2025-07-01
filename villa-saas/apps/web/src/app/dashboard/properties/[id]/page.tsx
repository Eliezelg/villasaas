'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { propertiesService } from '@/services/properties.service';
import type { Property } from '@/types/property';

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
};

const statusLabels = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' as const },
  PUBLISHED: { label: 'Publié', variant: 'success' as const },
  ARCHIVED: { label: 'Archivé', variant: 'destructive' as const },
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadProperty(params.id as string);
    }
  }, [params.id]);

  async function loadProperty(id: string) {
    setIsLoading(true);
    setError(null);

    const { data, error } = await propertiesService.getById(id);

    if (error) {
      setError(error.message || 'Erreur lors du chargement de la propriété');
    } else if (data) {
      setProperty(data);
    }

    setIsLoading(false);
  }

  async function handleDelete() {
    if (!property || !confirm(`Êtes-vous sûr de vouloir supprimer "${property.name}" ?`)) {
      return;
    }

    const { error } = await propertiesService.delete(property.id);

    if (!error) {
      router.push('/dashboard/properties');
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error || 'Propriété non trouvée'}
        </div>
        <Button asChild className="mt-4">
          <Link href="/dashboard/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux propriétés
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{property.name}</h1>
            <p className="text-muted-foreground">
              {propertyTypeLabels[property.propertyType]} • {property.city}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusLabels[property.status].variant}>
            {statusLabels[property.status].label}
          </Badge>
          <Button variant="outline" size="icon">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p>{property.description?.fr || 'Aucune description'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p>{property.address}</p>
                <p>{property.postalCode} {property.city}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Caractéristiques</p>
                <p>{property.bedrooms} chambres • {property.bathrooms} salles de bain</p>
                <p>{property.maxGuests} voyageurs max</p>
                {property.surfaceArea && <p>{property.surfaceArea} m²</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarification</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Prix de base</p>
              <p className="text-lg font-semibold">{property.basePrice} € / nuit</p>
            </div>
            {property.weekendPremium && (
              <div>
                <p className="text-sm text-muted-foreground">Supplément weekend</p>
                <p className="text-lg font-semibold">+{property.weekendPremium} €</p>
              </div>
            )}
            {property.cleaningFee && (
              <div>
                <p className="text-sm text-muted-foreground">Frais de ménage</p>
                <p className="text-lg font-semibold">{property.cleaningFee} €</p>
              </div>
            )}
            {property.securityDeposit && (
              <div>
                <p className="text-sm text-muted-foreground">Caution</p>
                <p className="text-lg font-semibold">{property.securityDeposit} €</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Règles de réservation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Séjour minimum</p>
                <p>{property.minNights} {property.minNights > 1 ? 'nuits' : 'nuit'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horaires</p>
                <p>Arrivée: {property.checkInTime}</p>
                <p>Départ: {property.checkOutTime}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Réservation instantanée</p>
              <p>{property.instantBooking ? 'Activée' : 'Désactivée'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}