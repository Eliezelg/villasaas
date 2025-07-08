'use client';

import { useProperty } from '@/contexts/property-context';
import { LocationContentEditor } from '@/components/admin/property/location-content-editor';

export default function ContentLocationPage() {
  const { property, isLoading } = useProperty();

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

  if (!property.customPages?.location) {
    return (
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        La page "Localisation" n'est pas activée pour cette propriété. 
        Veuillez l'activer dans les paramètres.
      </div>
    );
  }

  return (
    <LocationContentEditor
      propertyId={property.id}
      initialContent={property.locationContent}
    />
  );
}