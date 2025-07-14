'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useProperty } from '@/contexts/property-context';
import { apiClient } from '@/lib/api-client';

// Schéma de validation
const detailsSchema = z.object({
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  maxGuests: z.number().min(1),
  surfaceArea: z.number().optional(),
});

export default function PropertyDetailsPage() {
  const { toast } = useToast();
  const { property, isLoading, reload } = useProperty();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      surfaceArea: undefined,
    }
  });

  // Mettre à jour le formulaire quand la propriété est chargée
  useEffect(() => {
    if (property) {
      form.reset({
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        maxGuests: property.maxGuests || 1,
        surfaceArea: property.surfaceArea || undefined,
      });
    }
  }, [property, form]);

  const onSubmit = async (data: z.infer<typeof detailsSchema>) => {
    if (!property) return;
    
    setIsSaving(true);
    try {
      const response = await apiClient.patch(`/api/properties/${property.id}`, data);
      
      if (response.error) {
        toast({
          title: "Erreur",
          description: response.error.message || "Impossible de sauvegarder",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Modifications enregistrées",
        description: "Les détails ont été mis à jour",
      });
      
      setIsEditing(false);
      reload();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="grid gap-6">
      <div className="flex justify-end">
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              form.reset();
            }}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Caractéristiques de la propriété</CardTitle>
          <CardDescription>
            Les détails essentiels de votre propriété
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            // Mode lecture
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Chambres</p>
                <p className="text-3xl font-bold">{property.bedrooms}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Salles de bain</p>
                <p className="text-3xl font-bold">{property.bathrooms}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Capacité maximale</p>
                <p className="text-3xl font-bold">{property.maxGuests}</p>
                <p className="text-sm text-muted-foreground">voyageurs</p>
              </div>
              {property.surfaceArea && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Surface</p>
                  <p className="text-3xl font-bold">{property.surfaceArea}</p>
                  <p className="text-sm text-muted-foreground">m²</p>
                </div>
              )}
            </div>
          ) : (
            // Mode édition
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chambres</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salles de bain</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacité max</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1"
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="surfaceArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surface (m²)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1"
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Équipements et Services</CardTitle>
          <CardDescription>
            Les équipements disponibles dans votre propriété
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cette section sera disponible prochainement
          </p>
        </CardContent>
      </Card>
    </div>
  );
}