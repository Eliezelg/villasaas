'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { propertiesService } from '@/services/properties.service';
import { useToast } from '@/hooks/use-toast';

const bookingRulesSchema = z.object({
  minNights: z.coerce.number().min(1).max(30),
  checkInTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  checkOutTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  checkInDays: z.array(z.number()).min(1, 'Au moins un jour doit être sélectionné'),
  instantBooking: z.boolean()
});

type BookingRulesFormData = z.infer<typeof bookingRulesSchema>;

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

interface BookingRulesFormProps {
  propertyId: string;
  initialData?: {
    minNights: number;
    checkInTime: string;
    checkOutTime: string;
    checkInDays: number[];
    instantBooking: boolean;
  };
  onUpdate?: () => void;
}

export function BookingRulesForm({ propertyId, initialData, onUpdate }: BookingRulesFormProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<BookingRulesFormData>({
    resolver: zodResolver(bookingRulesSchema),
    defaultValues: initialData || {
      minNights: 2,
      checkInTime: '16:00',
      checkOutTime: '11:00',
      checkInDays: [0, 1, 2, 3, 4, 5, 6],
      instantBooking: false
    }
  });

  const handleSubmit = async (data: BookingRulesFormData) => {
    try {
      setSaving(true);
      await propertiesService.update(propertyId, data);
      
      toast({
        title: 'Succès',
        description: 'Les règles de réservation ont été mises à jour'
      });
      
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les règles',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const checkInDays = form.watch('checkInDays');

  const handleDayToggle = (day: number) => {
    const current = form.getValues('checkInDays');
    if (current.includes(day)) {
      form.setValue('checkInDays', current.filter(d => d !== day));
    } else {
      form.setValue('checkInDays', [...current, day].sort());
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Règles de réservation
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Définissez les conditions de réservation pour votre propriété
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="minNights"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre minimum de nuits</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Les clients devront réserver au minimum ce nombre de nuits
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="checkInTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure d'arrivée</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="time"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkOutTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure de départ</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="time"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="checkInDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jours d'arrivée autorisés</FormLabel>
                <FormDescription>
                  Sélectionnez les jours où les clients peuvent commencer leur séjour
                </FormDescription>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {dayNames.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <Label className="text-xs text-muted-foreground">
                        {day.slice(0, 3)}
                      </Label>
                      <Checkbox
                        checked={checkInDays.includes(index)}
                        onCheckedChange={() => handleDayToggle(index)}
                      />
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instantBooking"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Réservation instantanée
                  </FormLabel>
                  <FormDescription>
                    Les clients peuvent réserver sans validation de votre part
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

          <div className="rounded-lg bg-muted p-4">
            <div className="flex gap-2 text-sm">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-muted-foreground">
                Ces règles s'appliquent à toutes les réservations. Vous pouvez définir des règles 
                spécifiques par période dans la section "Périodes tarifaires".
              </div>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Enregistrement...' : 'Enregistrer les règles'}
          </Button>
        </form>
      </Form>
    </Card>
  );
}