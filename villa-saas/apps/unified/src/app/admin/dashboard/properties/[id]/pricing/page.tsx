'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProperty } from '@/contexts/property-context';
import { PeriodsManager } from '@/components/admin/pricing/periods-manager';
import { InteractivePricingCalendar } from '@/components/admin/pricing/interactive-pricing-calendar';

export default function PropertyPricingPage() {
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
      <Card>
        <CardHeader>
          <CardTitle>Tarifs de base</CardTitle>
          <CardDescription>
            Prix par défaut appliqués quand aucune période tarifaire n'est active
          </CardDescription>
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

      <PeriodsManager 
        propertyId={property.id} 
        propertyName={property.name}
      />

      <InteractivePricingCalendar
        propertyId={property.id}
        basePrice={property.basePrice}
        weekendPremium={property.weekendPremium}
      />
    </div>
  );
}