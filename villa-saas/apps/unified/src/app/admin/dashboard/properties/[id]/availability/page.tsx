'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProperty } from '@/contexts/property-context';
import { AvailabilityCalendar } from '@/components/admin/availability/availability-calendar';
import { BlockedPeriodsManager } from '@/components/admin/availability/blocked-periods-manager';
import { BookingRulesForm } from '@/components/admin/availability/booking-rules-form';

export default function PropertyAvailabilityPage() {
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
    <div className="space-y-6">
      <BookingRulesForm
        propertyId={property.id}
        initialData={{
          minNights: property.minNights,
          checkInTime: property.checkInTime,
          checkOutTime: property.checkOutTime,
          checkInDays: property.checkInDays || [0, 1, 2, 3, 4, 5, 6],
          instantBooking: property.instantBooking
        }}
        onUpdate={() => loadProperty(property.id)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Calendrier de disponibilité</CardTitle>
          <CardDescription>
            Visualisez les disponibilités et gérez les périodes bloquées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvailabilityCalendar 
            propertyId={property.id}
            checkInDays={property.checkInDays || [0, 1, 2, 3, 4, 5, 6]}
            minNights={property.minNights}
          />
          <BlockedPeriodsManager 
            propertyId={property.id} 
            onUpdate={reload}
          />
        </CardContent>
      </Card>
    </div>
  );
}