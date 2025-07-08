'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { bookingOptionsService } from '@/services/booking-options.service';

const formSchema = z.object({
  name: z.object({
    fr: z.string().min(1, 'Le nom en français est requis'),
    en: z.string().optional(),
  }),
  description: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }),
  category: z.enum([
    'CLEANING',
    'CATERING',
    'TRANSPORT',
    'ACTIVITIES',
    'EQUIPMENT',
    'WELLNESS',
    'CHILDCARE',
    'PET',
    'COMFORT',
    'OTHER',
  ]),
  pricingType: z.enum(['PER_PERSON', 'PER_GROUP', 'FIXED']),
  pricePerUnit: z.coerce.number().positive('Le prix doit être positif'),
  pricingPeriod: z.enum(['PER_DAY', 'PER_STAY']),
  isMandatory: z.boolean().default(false),
  minQuantity: z.coerce.number().int().min(0).default(0),
  maxQuantity: z.coerce.number().int().positive().optional(),
  minGuests: z.coerce.number().int().positive().optional(),
  maxGuests: z.coerce.number().int().positive().optional(),
  minNights: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface CreateOptionDialogProps {
  onSuccess: () => void;
}

export function CreateOptionDialog({ onSuccess }: CreateOptionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: { fr: '', en: '' },
      description: { fr: '', en: '' },
      category: 'OTHER',
      pricingType: 'FIXED',
      pricingPeriod: 'PER_STAY',
      isMandatory: false,
      minQuantity: 0,
      isActive: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await bookingOptionsService.createOption(data);
      toast({
        title: 'Succès',
        description: 'Option créée avec succès',
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'option',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Créer une nouvelle option</DialogTitle>
        <DialogDescription>
          Créez une option qui sera disponible pour toutes vos propriétés
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="fr" className="w-full">
            <TabsList>
              <TabsTrigger value="fr">Français</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fr" className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="name.fr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom (FR) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ménage quotidien" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description.fr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (FR)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description de l'option..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            <TabsContent value="en" className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="name.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom (EN)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Daily cleaning" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (EN)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Option description..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CLEANING">Ménage</SelectItem>
                    <SelectItem value="CATERING">Restauration</SelectItem>
                    <SelectItem value="TRANSPORT">Transport</SelectItem>
                    <SelectItem value="ACTIVITIES">Activités</SelectItem>
                    <SelectItem value="EQUIPMENT">Équipement</SelectItem>
                    <SelectItem value="WELLNESS">Bien-être</SelectItem>
                    <SelectItem value="CHILDCARE">Enfants</SelectItem>
                    <SelectItem value="PET">Animaux</SelectItem>
                    <SelectItem value="COMFORT">Confort</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pricingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de tarification</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PER_PERSON">Par personne</SelectItem>
                      <SelectItem value="PER_GROUP">Par groupe</SelectItem>
                      <SelectItem value="FIXED">Prix fixe</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricingPeriod"
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
                      <SelectItem value="PER_DAY">Par jour</SelectItem>
                      <SelectItem value="PER_STAY">Par séjour</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="pricePerUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix unitaire (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isMandatory"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Option obligatoire</FormLabel>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité minimum</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité maximum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Illimité"
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
                name="minGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre minimum d'invités</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Aucun"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="Aucun"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'option'}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}