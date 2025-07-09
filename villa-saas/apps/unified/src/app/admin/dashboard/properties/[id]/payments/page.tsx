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
import { useProperty } from '@/contexts/property-context';
import { bookingOptionsService } from '@/services/booking-options.service';
import type { PaymentConfiguration } from '@villa-saas/database';

const formSchema = z.object({
  // Acompte
  depositType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  depositValue: z.coerce.number().positive('La valeur doit être positive'),
  depositDueDate: z.enum(['AT_BOOKING', 'DAYS_BEFORE_CHECKIN']),
  depositDueDays: z.coerce.number().int().positive().optional(),
  
  // Taxe de séjour
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
  
  // Frais de service
  serviceFeeEnabled: z.boolean(),
  serviceFeeType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  serviceFeeValue: z.coerce.number().positive().optional(),
  
  // Règles de paiement
  allowPartialPayment: z.boolean(),
  balanceDueDays: z.coerce.number().int().positive(),
});

type FormData = z.infer<typeof formSchema>;

export default function PropertyPaymentsPage() {
  const { property, isLoading: propertyLoading } = useProperty();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
      fetchConfig();
    }
  }, [property]);

  const fetchConfig = async () => {
    try {
      const { data } = await bookingOptionsService.getPaymentConfig();
      if (data) {
        form.reset({
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
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await bookingOptionsService.updatePaymentConfig(data);
      toast({
        title: 'Succès',
        description: 'Configuration enregistrée avec succès',
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

  const depositDueDate = form.watch('depositDueDate');
  const touristTaxEnabled = form.watch('touristTaxEnabled');
  const touristTaxType = form.watch('touristTaxType');
  const serviceFeeEnabled = form.watch('serviceFeeEnabled');

  if (propertyLoading) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  if (!property) {
    return (
      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        Propriété non trouvée
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Chargement de la configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acompte</CardTitle>
              <CardDescription>
                Configuration de l'acompte demandé lors de la réservation pour {property.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="depositValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Valeur {form.watch('depositType') === 'PERCENTAGE' ? '(%)' : '(€)'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={form.watch('depositType') === 'PERCENTAGE' ? '1' : '0.01'}
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
                  control={form.control}
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
                    control={form.control}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxe de séjour</CardTitle>
              <CardDescription>
                Configuration de la taxe de séjour selon votre région
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
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
                    control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="touristTaxPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Période de facturation</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="PER_NIGHT">Par nuit</SelectItem>
                                  <SelectItem value="PER_STAY">Par séjour</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="touristTaxMaxNights"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre max de nuits taxées</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Illimité"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Laisser vide pour taxer toutes les nuits
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  {touristTaxType === 'PERCENTAGE_OF_ACCOMMODATION' && (
                    <FormField
                      control={form.control}
                      name="touristTaxAdultPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pourcentage (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" max="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {touristTaxType === 'FIXED_PER_STAY' && (
                    <FormField
                      control={form.control}
                      name="touristTaxAdultPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant fixe (€)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frais de service</CardTitle>
              <CardDescription>
                Frais additionnels appliqués à toutes les réservations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="serviceFeeEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Activer les frais de service</FormLabel>
                      <FormDescription>
                        Appliquer des frais de service aux réservations
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

              {serviceFeeEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serviceFeeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de frais</FormLabel>
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
                    control={form.control}
                    name="serviceFeeValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Valeur {form.watch('serviceFeeType') === 'PERCENTAGE' ? '(%)' : '(€)'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={form.watch('serviceFeeType') === 'PERCENTAGE' ? '0.1' : '0.01'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Règles de paiement</CardTitle>
              <CardDescription>
                Options de paiement pour les clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
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