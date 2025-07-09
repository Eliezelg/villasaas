'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { bookingOptionsService } from '@/services/booking-options.service';
import type { BookingOptionWithProperties } from '@/services/booking-options.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateOptionDialog } from './create-option-dialog';

interface PropertyOptionsManagerProps {
  propertyId: string;
}

export function PropertyOptionsManager({ propertyId }: PropertyOptionsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [options, setOptions] = useState<BookingOptionWithProperties[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, [propertyId]);

  const fetchOptions = async () => {
    try {
      const { data, error } = await bookingOptionsService.getPropertyOptions(propertyId);
      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les options',
          variant: 'destructive',
        });
        setOptions([]);
      } else if (data) {
        // S'assurer que data est un tableau
        setOptions(Array.isArray(data) ? data : []);
      } else {
        setOptions([]);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les options',
        variant: 'destructive',
      });
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (optionId: string, enabled: boolean) => {
    setSaving(optionId);
    try {
      if (enabled) {
        await bookingOptionsService.configurePropertyOption(propertyId, optionId, {
          isEnabled: true,
        });
      } else {
        await bookingOptionsService.disablePropertyOption(propertyId, optionId);
      }
      toast({
        title: 'Succès',
        description: enabled ? 'Option activée' : 'Option désactivée',
      });
      fetchOptions();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier l\'option',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handlePriceChange = async (optionId: string, customPrice: number | undefined) => {
    setSaving(optionId);
    try {
      await bookingOptionsService.configurePropertyOption(propertyId, optionId, {
        customPrice: customPrice || undefined,
      });
      toast({
        title: 'Succès',
        description: 'Prix personnalisé enregistré',
      });
      fetchOptions();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le prix',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const formatPrice = (option: BookingOptionWithProperties) => {
    const propertyOption = option.properties?.[0];
    const price = propertyOption?.customPrice || option.pricePerUnit;
    let formattedPrice = `${price}€`;
    
    if (option.pricingType === 'PER_PERSON') {
      formattedPrice += '/pers';
    }
    
    if (option.pricingPeriod === 'PER_DAY') {
      formattedPrice += '/jour';
    }
    
    return formattedPrice;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement des options...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Options et services</CardTitle>
            <CardDescription>
              Gérez les options supplémentaires disponibles pour cette propriété
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une option
                </Button>
              </DialogTrigger>
              <CreateOptionDialog
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  fetchOptions();
                }}
              />
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!Array.isArray(options) || options.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucune option disponible. Créez votre première option pour commencer.
          </div>
        ) : (
          <div className="grid gap-4">
            {options.map((option) => {
              const propertyOption = option.properties?.[0];
              const isEnabled = propertyOption?.isEnabled ?? false;
              const customPrice = propertyOption?.customPrice;
              
              return (
                <div
                  key={option.id}
                  className={`border rounded-lg p-4 ${!isEnabled ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {typeof option.name === 'object' ? (option.name as any).fr || 'Sans nom' : 'Sans nom'}
                      </h4>
                      {typeof option.description === 'object' && (option.description as any).fr && (
                        <p className="text-sm text-muted-foreground">
                          {(option.description as any).fr}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(option.id, checked)}
                      disabled={saving === option.id}
                    />
                  </div>
                  
                  {isEnabled && (
                    <>
                      <div className="flex gap-2 flex-wrap mb-3">
                        <Badge variant="secondary">
                          {bookingOptionsService.formatOptionCategory(option.category)}
                        </Badge>
                        <Badge variant="outline">
                          {bookingOptionsService.formatPricingType(option.pricingType)}
                        </Badge>
                        <Badge variant="outline">
                          {bookingOptionsService.formatPricingPeriod(option.pricingPeriod)}
                        </Badge>
                        {option.isMandatory && (
                          <Badge variant="destructive">Obligatoire</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Prix par défaut</label>
                          <p className="text-lg font-semibold">{formatPrice(option)}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Prix personnalisé (€)</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={option.pricePerUnit.toString()}
                            defaultValue={customPrice ?? undefined}
                            disabled={saving === option.id}
                            className="mt-1"
                            onBlur={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : undefined;
                              if (value !== customPrice) {
                                handlePriceChange(option.id, value);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {(option.minGuests || option.maxGuests || option.minNights) && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          <p>Conditions :</p>
                          <ul className="list-disc list-inside mt-1">
                            {option.minGuests && <li>Minimum {option.minGuests} invités</li>}
                            {option.maxGuests && <li>Maximum {option.maxGuests} invités</li>}
                            {option.minNights && <li>Minimum {option.minNights} nuits</li>}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}