'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { propertiesService } from '@/services/properties.service';
import { ImageUploadS3 } from '@/components/admin/properties/image-upload-s3';
import { useProperty } from '@/contexts/property-context';

export default function PropertyGeneralPage() {
  const router = useRouter();
  const { property, isLoading, reload } = useProperty();

  async function handleDelete() {
    if (!property || !confirm(`Êtes-vous sûr de vouloir supprimer "${property.name}" ?`)) {
      return;
    }

    const { error } = await propertiesService.delete(property.id);

    if (!error) {
      router.push('/admin/dashboard/properties');
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  if (!property) {
    return (
      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        Propriété non trouvée
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/admin/dashboard/properties/${property.id}/preview`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="icon">
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            Ajoutez des photos de votre propriété. La première image sera l'image principale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploadS3
            propertyId={property.id}
            images={property.images || []}
            onImagesChange={reload}
          />
        </CardContent>
      </Card>

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
    </div>
  );
}