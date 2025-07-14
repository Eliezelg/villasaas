'use client';

import { PropertyOptionsManager } from '@/components/admin/pricing/property-options-manager';
import { useProperty } from '@/contexts/property-context';

export default function PropertyOptionsPage() {
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

  return (
    <div className="space-y-6">
      <PropertyOptionsManager propertyId={property.id} />
    </div>
  );
}