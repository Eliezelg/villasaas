'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Edit2, Save, X, MapPin } from 'lucide-react';
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
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useProperty } from '@/contexts/property-context';
import { apiClient } from '@/lib/api-client';

// Schéma de validation
const locationSchema = z.object({
  address: z.string().min(1, 'L\'adresse est requise'),
  city: z.string().min(1, 'La ville est requise'),
  postalCode: z.string().min(1, 'Le code postal est requis'),
  country: z.string().default('FR'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export default function PropertyLocationPage() {
  const { toast } = useToast();
  const { property, isLoading, reload } = useProperty();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const form = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      address: '',
      city: '',
      postalCode: '',
      country: 'FR',
      latitude: undefined,
      longitude: undefined,
    }
  });

  // Mettre à jour le formulaire quand la propriété est chargée
  useEffect(() => {
    if (property) {
      form.reset({
        address: property.address || '',
        city: property.city || '',
        postalCode: property.postalCode || '',
        country: property.country || 'FR',
        latitude: property.latitude || undefined,
        longitude: property.longitude || undefined,
      });
    }
  }, [property, form]);

  const handleGeocode = async () => {
    const address = form.getValues('address');
    const city = form.getValues('city');
    const postalCode = form.getValues('postalCode');
    const country = form.getValues('country');

    if (!address || !city) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir l'adresse et la ville",
        variant: "destructive",
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const query = `${address}, ${postalCode} ${city}, ${country}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        form.setValue('latitude', parseFloat(lat));
        form.setValue('longitude', parseFloat(lon));
        toast({
          title: "Géolocalisation réussie",
          description: "Les coordonnées ont été trouvées",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de géolocaliser cette adresse",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la géolocalisation",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof locationSchema>) => {
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
        description: "La localisation a été mise à jour",
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
          <CardTitle>Adresse de la propriété</CardTitle>
          <CardDescription>
            L'adresse exacte de votre propriété pour la localisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            // Mode lecture
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Adresse complète</p>
                <p className="font-medium">{property.address}</p>
                <p className="text-sm">{property.postalCode} {property.city}, {property.country}</p>
              </div>
              {(property.latitude && property.longitude) && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Latitude</p>
                    <p className="font-mono">{property.latitude}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Longitude</p>
                    <p className="font-mono">{property.longitude}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Mode édition
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Rue de la Plage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nice" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="06000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="FR" />
                      </FormControl>
                      <FormDescription>
                        Code pays ISO (FR, ES, IT, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">Coordonnées GPS</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGeocode}
                      disabled={isGeocoding}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {isGeocoding ? "Recherche..." : "Géolocaliser"}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.000001"
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.000001"
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {property.latitude && property.longitude && (
        <Card>
          <CardHeader>
            <CardTitle>Carte</CardTitle>
            <CardDescription>
              Position de votre propriété sur la carte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Carte interactive (à implémenter)
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}