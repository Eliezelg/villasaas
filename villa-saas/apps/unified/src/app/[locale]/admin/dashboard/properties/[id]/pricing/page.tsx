'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { bookingOptionsService } from '@/services/booking-options.service';
import { useProperty } from '@/contexts/property-context';
import { PeriodsManager } from '@/components/admin/pricing/periods-manager';
import { InteractivePricingCalendar } from '@/components/admin/pricing/interactive-pricing-calendar';

const paymentFormSchema = z.object({
  depositType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  depositValue: z.coerce.number().positive('La valeur doit être positive'),
  depositDueDate: z.enum(['AT_BOOKING', 'DAYS_BEFORE_CHECKIN']),
  depositDueDays: z.coerce.number().int().positive().optional(),
  touristTaxEnabled: z.boolean(),
  touristTaxType: z.enum([
    'PER_PERSON_PER_NIGHT',
    'PERCENTAGE_OF_ACCOMMODATION',
    'FIXED_PER_STAY',
    'TIERED_BY_PROPERTY_TYPE'
  ]).optional(),
  touristTaxAdultPrice: z.coerce.number().positive().optional(),
  touristTaxChildPrice: z.coerce.number().min(0, 'La valeur doit être positive ou nulle').optional(),
  touristTaxChildAge: z.coerce.number().int().positive().optional(),
  touristTaxPeriod: z.enum(['PER_NIGHT', 'PER_STAY']).optional(),
  touristTaxMaxNights: z.coerce.number().int().positive().optional(),
  serviceFeeEnabled: z.boolean(),
  serviceFeeType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  serviceFeeValue: z.coerce.number().positive().optional(),
  allowPartialPayment: z.boolean(),
  balanceDueDays: z.coerce.number().int().positive(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function PropertyPricingPage() {
  const { property, isLoading, reload } = useProperty();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [paymentConfigLoading, setPaymentConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      depositType: 'PERCENTAGE',
      depositValue: 30,
      depositDueDate: 'AT_BOOKING',
      touristTaxEnabled: false,
      serviceFeeEnabled: false,
      allowPartialPayment: true,
      balanceDueDays: 7,
    },
  });

  useEffect(() => {
    if (property) {
      fetchPaymentConfig();
    }
  }, [property]);

  const fetchPaymentConfig = async () => {
    try {
      const { data } = await bookingOptionsService.getPaymentConfig();
      if (data) {
        paymentForm.reset({
          depositType: data.depositType,
          depositValue: data.depositValue,
          depositDueDate: data.depositDueDate,
          depositDueDays: data.depositDueDays || undefined,
          touristTaxEnabled: data.touristTaxEnabled,
          touristTaxType: data.touristTaxType || undefined,
          touristTaxAdultPrice: data.touristTaxAdultPrice ?? undefined,
          touristTaxChildPrice: data.touristTaxChildPrice ?? undefined,
          touristTaxChildAge: data.touristTaxChildAge ?? undefined,
          touristTaxPeriod: data.touristTaxPeriod ?? undefined,
          touristTaxMaxNights: data.touristTaxMaxNights ?? undefined,
          serviceFeeEnabled: data.serviceFeeEnabled,
          serviceFeeType: data.serviceFeeType || undefined,
          serviceFeeValue: data.serviceFeeValue ?? undefined,
          allowPartialPayment: data.allowPartialPayment,
          balanceDueDays: data.balanceDueDays,
        });
      }
    } catch (error) {
      // Configuration non trouvée, utiliser les valeurs par défaut
    } finally {
      setPaymentConfigLoading(false);
    }
  };

  const onSubmitPaymentConfig = async (data: PaymentFormData) => {
    setSaving(true);
    try {
      await bookingOptionsService.updatePaymentConfig(data);
      toast({
        title: 'Succès',
        description: 'Configuration des paiements enregistrée',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const depositDueDate = paymentForm.watch('depositDueDate');
  const touristTaxEnabled = paymentForm.watch('touristTaxEnabled');
  const touristTaxType = paymentForm.watch('touristTaxType');
  const serviceFeeEnabled = paymentForm.watch('serviceFeeEnabled');

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
        onUpdate={() => setRefreshKey(prev => prev + 1)}
      />

      <InteractivePricingCalendar
        key={refreshKey}
        propertyId={property.id}
        basePrice={property.basePrice}
        weekendPremium={property.weekendPremium}
      />

      {/* Configuration des paiements */}
      <Form {...paymentForm}>
        <form onSubmit={paymentForm.handleSubmit(onSubmitPaymentConfig)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des acomptes</CardTitle>
              <CardDescription>
                Définissez les règles d'acompte pour cette propriété
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={paymentForm.control}
                  name="depositType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'acompte</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Pourcentage</SelectItem>
                          <SelectItem value="FIXED_AMOUNT">Montant fixe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="depositValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Valeur {paymentForm.watch('depositType') === 'PERCENTAGE' ? '(%)' : '(€)'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={paymentForm.watch('depositType') === 'PERCENTAGE' ? '1' : '0.01'}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={paymentForm.control}
                  name="depositDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quand l'acompte est-il dû ?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AT_BOOKING">À la réservation</SelectItem>
                          <SelectItem value="DAYS_BEFORE_CHECKIN">X jours avant l'arrivée</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {depositDueDate === 'DAYS_BEFORE_CHECKIN' && (
                  <FormField
                    control={paymentForm.control}
                    name="depositDueDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de jours avant l'arrivée</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={paymentForm.control}
                name="allowPartialPayment"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Autoriser le paiement partiel</FormLabel>
                      <FormDescription>
                        Les clients peuvent payer en plusieurs fois
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name="balanceDueDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solde dû X jours avant l'arrivée</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre de jours avant l'arrivée pour régler le solde restant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxe de séjour</CardTitle>
              <CardDescription>
                Configuration de la taxe de séjour pour cette propriété
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={paymentForm.control}
                name="touristTaxEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Activer la taxe de séjour</FormLabel>
                      <FormDescription>
                        Appliquer une taxe de séjour aux réservations
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {touristTaxEnabled && (
                <>
                  <FormField
                    control={paymentForm.control}
                    name="touristTaxType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de calcul</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PER_PERSON_PER_NIGHT">
                              Par personne et par nuit
                            </SelectItem>
                            <SelectItem value="PERCENTAGE_OF_ACCOMMODATION">
                              Pourcentage du logement
                            </SelectItem>
                            <SelectItem value="FIXED_PER_STAY">
                              Montant fixe par séjour
                            </SelectItem>
                            <SelectItem value="TIERED_BY_PROPERTY_TYPE">
                              Selon le type de propriété
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {touristTaxType === 'PER_PERSON_PER_NIGHT' && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={paymentForm.control}
                          name="touristTaxAdultPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prix par adulte (€)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentForm.control}
                          name="touristTaxChildPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prix par enfant (€)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentForm.control}
                          name="touristTaxChildAge"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Âge limite enfant</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="18" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}