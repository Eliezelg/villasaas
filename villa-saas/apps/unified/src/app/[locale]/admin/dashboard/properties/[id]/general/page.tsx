'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Edit2, Trash2, Eye, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { propertiesService } from '@/services/properties.service';
import { ImageUploadS3 } from '@/components/admin/properties/image-upload-s3';
import { useProperty } from '@/contexts/property-context';
import { apiClient } from '@/lib/api-client';

// Schéma de validation
const generalSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LOFT', 'CHALET', 'BUNGALOW', 'MOBILE_HOME', 'BOAT', 'OTHER']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  instantBooking: z.boolean(),
  description: z.object({
    fr: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
    en: z.string().optional(),
  }),
});

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'LOFT', label: 'Loft' },
  { value: 'CHALET', label: 'Chalet' },
  { value: 'BUNGALOW', label: 'Bungalow' },
  { value: 'MOBILE_HOME', label: 'Mobil-home' },
  { value: 'BOAT', label: 'Bateau' },
  { value: 'OTHER', label: 'Autre' },
];

export default function PropertyGeneralPage() {
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const { property, isLoading, reload } = useProperty();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof generalSchema>>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: '',
      propertyType: 'VILLA',
      status: 'DRAFT',
      instantBooking: false,
      description: {
        fr: '',
      },
    }
  });

  // Mettre à jour le formulaire quand la propriété est chargée
  useEffect(() => {
    if (property) {
      form.reset({
        name: property.name || '',
        propertyType: property.propertyType || 'VILLA',
        status: property.status || 'DRAFT',
        instantBooking: property.instantBooking || false,
        description: property.description || { fr: '' },
      });
    }
  }, [property, form]);

  async function handleDelete() {
    if (!property || !confirm(`Êtes-vous sûr de vouloir supprimer "${property.name}" ?`)) {
      return;
    }

    const { error } = await propertiesService.delete(property.id);

    if (!error) {
      router.push(`/${locale}/admin/dashboard/properties`);
    }
  }

  const onSubmit = async (data: z.infer<typeof generalSchema>) => {
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
        description: "Les informations ont été mises à jour",
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
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/${locale}/admin/dashboard/properties/${property.id}/preview`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <>
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
          </>
        )}
        <Button variant="outline" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            Ajoutez des photos de votre propriété. La première image sera l'image principale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploadS3
            propertyId={property.id}
            images={property.images || []}
            onImagesChange={reload}
          />
        </CardContent>
      </Card>

      {!isEditing ? (
        // Mode lecture
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom de la propriété</p>
                <p className="font-medium">{property.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{PROPERTY_TYPES.find(t => t.value === property.propertyType)?.label}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className="font-medium">
                  {property.status === 'PUBLISHED' ? 'Publié' : 
                   property.status === 'DRAFT' ? 'Brouillon' : 'Archivé'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Réservation instantanée</p>
                <p className="font-medium">{property.instantBooking ? 'Activée' : 'Désactivée'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <Tabs defaultValue="fr" className="w-full">
                <TabsList>
                  <TabsTrigger value="fr">Français</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fr">
                  <p className="whitespace-pre-wrap">{property.description?.fr || 'Aucune description'}</p>
                </TabsContent>
                
                <TabsContent value="en">
                  <p className="whitespace-pre-wrap">{property.description?.en || 'No description'}</p>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Mode édition
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la propriété</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Villa Paradise" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de propriété</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROPERTY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DRAFT">Brouillon</SelectItem>
                            <SelectItem value="PUBLISHED">Publié</SelectItem>
                            <SelectItem value="ARCHIVED">Archivé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="instantBooking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Réservation instantanée
                        </FormLabel>
                        <FormDescription>
                          Les clients peuvent réserver sans votre approbation
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

                <div>
                  <FormLabel>Description multilingue</FormLabel>
                  <Tabs defaultValue="fr" className="w-full mt-2">
                    <TabsList>
                      <TabsTrigger value="fr">Français</TabsTrigger>
                      <TabsTrigger value="en">English</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="fr">
                      <FormField
                        control={form.control}
                        name="description.fr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={6}
                                placeholder="Décrivez votre propriété..."
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum 10 caractères
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="en">
                      <FormField
                        control={form.control}
                        name="description.en"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={6}
                                placeholder="Describe your property..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
}