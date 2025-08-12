'use client';

import { useProperty } from '@/contexts/property-context';
import { PropertyOptionsManager } from '@/components/admin/pricing/property-options-manager';

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
      
      <div className="text-sm text-muted-foreground">
        <p>💡 Les options de réservation permettent d'ajouter des services supplémentaires comme :</p>
        <ul className="mt-2 ml-6 space-y-1 list-disc">
          <li>Ménage de fin de séjour</li>
          <li>Draps et serviettes</li>
          <li>Petit-déjeuner</li>
          <li>Transfert aéroport</li>
          <li>Location de matériel (vélos, équipements bébé, etc.)</li>
        </ul>
      </div>
    </div>
  );
}