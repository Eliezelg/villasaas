'use client';

import { useProperty } from '@/contexts/property-context';
import { RoomsContentEditor } from '@/components/admin/property/rooms-content-editor';

export default function ContentRoomsPage() {
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

  if (!property.customPages?.rooms) {
    return (
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        La page "Chambres" n'est pas activée pour cette propriété. 
        Veuillez l'activer dans les paramètres.
      </div>
    );
  }

  return (
    <RoomsContentEditor
      propertyId={property.id}
      initialContent={property.roomsContent}
    />
  );
}