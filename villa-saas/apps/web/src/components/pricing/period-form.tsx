'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { Period, CreatePeriodData } from '@/services/periods.service';

const periodSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  priority: z.coerce.number().int().min(0).default(0),
  basePrice: z.coerce.number().positive('Le prix doit être positif'),
  weekendPremium: z.coerce.number().min(0).default(0),
  minNights: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof periodSchema>;

interface PeriodFormProps {
  period?: Period | null;
  onSave: (data: CreatePeriodData) => void;
  onCancel: () => void;
}

export function PeriodForm({ period, onSave, onCancel }: PeriodFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: period ? {
      name: period.name,
      startDate: period.startDate.split('T')[0],
      endDate: period.endDate.split('T')[0],
      priority: period.priority,
      basePrice: period.basePrice,
      weekendPremium: period.weekendPremium,
      minNights: period.minNights,
      isActive: period.isActive,
    } : {
      name: '',
      startDate: '',
      endDate: '',
      priority: 0,
      basePrice: 100,
      weekendPremium: 0,
      minNights: 1,
      isActive: true,
    },
  });

  function onSubmit(data: FormData) {
    onSave({
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de la période</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Haute saison été" {...field} />
                </FormControl>
                <FormDescription>
                  Un nom descriptif pour identifier facilement cette période
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de début</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de fin</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="basePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix de base par nuit (€)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    Le tarif de base pour cette période
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weekendPremium"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplément weekend (€)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    Supplément pour les nuits du vendredi et samedi
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="minNights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Séjour minimum (nuits)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nombre minimum de nuits pour cette période
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Plus le nombre est élevé, plus la période est prioritaire en cas de chevauchement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Période active</FormLabel>
                  <FormDescription>
                    Les périodes inactives ne sont pas appliquées aux réservations
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
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {period ? 'Modifier' : 'Créer'} la période
          </Button>
        </div>
      </form>
    </Form>
  );
}