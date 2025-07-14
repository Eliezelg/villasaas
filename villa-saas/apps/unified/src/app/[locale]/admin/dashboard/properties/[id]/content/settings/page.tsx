'use client';

import { useProperty } from '@/contexts/property-context';
import { CustomPagesSettings } from '@/components/admin/property/custom-pages-settings';
import { propertiesService } from '@/services/properties.service';

export default function ContentSettingsPage() {
  const { property, isLoading, reload } = useProperty();

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
    <CustomPagesSettings
      propertyId={property.id}
      initialSettings={property.customPages || {}}
      onSettingsChange={async (settings) => {
        const { error } = await propertiesService.update(property.id, {
          customPages: settings
        });
        if (!error) {
          reload();
        }
      }}
    />
  );
}