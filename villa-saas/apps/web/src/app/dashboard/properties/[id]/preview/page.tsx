'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users, Bed, Bath, Square, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { propertiesService } from '@/services/properties.service';
import type { Property } from '@/types/property';
import { PriceCalculator } from '@/components/pricing/price-calculator';

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

const amenityLabels: Record<string, string> = {
  wifi: 'WiFi',
  pool: 'Piscine',
  parking: 'Parking',
  airConditioning: 'Climatisation',
  heating: 'Chauffage',
  kitchen: 'Cuisine équipée',
  washingMachine: 'Lave-linge',
  dishwasher: 'Lave-vaisselle',
  tv: 'Télévision',
  fireplace: 'Cheminée',
  bbq: 'Barbecue',
  garden: 'Jardin',
  terrace: 'Terrasse',
  balcony: 'Balcon',
  seaView: 'Vue mer',
  mountainView: 'Vue montagne',
  petFriendly: 'Animaux acceptés',
  smokingAllowed: 'Fumeurs acceptés',
  wheelchairAccessible: 'Accessible PMR',
};

export default function PropertyPreviewPage() {
  const params = useParams();
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

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error || 'Propriété non trouvée'}
        </div>
      </div>
    );
  }

  // Extraire les équipements actifs
  const activeAmenities = property.amenities
    ? Object.entries(property.amenities as Record<string, boolean>)
        .filter(([_, value]) => value)
        .map(([key]) => key)
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container max-w-6xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/dashboard/properties/${property.id}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-sm font-medium text-muted-foreground">
                  Prévisualisation de l'annonce
                </h1>
                <p className="text-xs text-muted-foreground">
                  Voici comment les voyageurs verront votre propriété
                </p>
              </div>
            </div>
            <Link href={`/dashboard/properties/${property.id}/edit`}>
              <Button variant="outline">Modifier</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="relative h-[400px] bg-muted">
        {property.images && property.images.length > 0 ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}${property.images[0].url}`}
            alt={property.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Aucune image disponible</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="container max-w-6xl py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">
                  {propertyTypeLabels[property.propertyType]}
                </Badge>
                {property.instantBooking && (
                  <Badge variant="default">Réservation instantanée</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{property.city}, {property.country}</span>
              </div>
            </div>

            {/* Key Features */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{property.maxGuests} voyageurs</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <span>{property.bedrooms} chambres</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-muted-foreground" />
                <span>{property.bathrooms} salles de bain</span>
              </div>
              {property.surfaceArea && (
                <div className="flex items-center gap-2">
                  <Square className="h-5 w-5 text-muted-foreground" />
                  <span>{property.surfaceArea} m²</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-4">À propos de ce logement</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {property.description?.fr || 'Aucune description disponible'}
              </p>
            </div>

            <Separator />

            {/* Amenities */}
            {activeAmenities.length > 0 && (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-4">Équipements</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {activeAmenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{amenityLabels[amenity] || amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* House Rules */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Règles de la maison</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Arrivée : à partir de {property.checkInTime}</p>
                <p>Départ : avant {property.checkOutTime}</p>
                <p>Séjour minimum : {property.minNights} {property.minNights > 1 ? 'nuits' : 'nuit'}</p>
              </div>
            </div>

            {/* Location */}
            {property.latitude && property.longitude && (
              <>
                <Separator />
                <div>
                  <h2 className="text-xl font-semibold mb-4">Emplacement</h2>
                  <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Carte interactive (latitude: {property.latitude}, longitude: {property.longitude})
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <PriceCalculator
                propertyId={property.id}
                basePrice={property.basePrice}
                cleaningFee={property.cleaningFee}
                maxGuests={property.maxGuests}
                minNights={property.minNights}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}