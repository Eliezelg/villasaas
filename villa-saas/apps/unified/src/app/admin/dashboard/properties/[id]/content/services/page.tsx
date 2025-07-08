'use client';

import { useProperty } from '@/contexts/property-context';
import { ServicesContentEditor } from '@/components/admin/property/services-content-editor';

export default function ContentServicesPage() {
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

  if (!property.customPages?.services) {
    return (
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        La page "Services" n'est pas activée pour cette propriété. 
        Veuillez l'activer dans les paramètres.
      </div>
    );
  }

  return (
    <ServicesContentEditor
      propertyId={property.id}
      initialContent={property.servicesContent}
    />
  );
}