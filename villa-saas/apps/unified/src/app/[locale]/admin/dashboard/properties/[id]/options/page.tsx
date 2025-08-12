'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { bookingOptionsService } from '@/services/booking-options.service';
import { PropertyOptionsManager } from '@/components/admin/pricing/property-options-manager';
import { useProperty } from '@/contexts/property-context';
import type { BookingOption } from '@prisma/client';

export default function PropertyOptionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { property, isLoading } = useProperty();
  const [options, setOptions] = useState<BookingOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (property) {
      fetchOptions();
    }
  }, [property]);

  const fetchOptions = async () => {
    try {
      const { data } = await bookingOptionsService.getAllOptions();
      if (data) {
        setOptions(data);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les options',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette option ?')) {
      return;
    }

    try {
      await bookingOptionsService.deleteOption(id);
      toast({
        title: 'Succès',
        description: 'Option supprimée avec succès',
      });
      fetchOptions();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer cette option',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (option: BookingOption) => {
    let price = `${option.pricePerUnit}€`;
    
    if (option.pricingType === 'PER_PERSON') {
      price += '/pers';
    }
    
    if (option.pricingPeriod === 'PER_DAY') {
      price += '/jour';
    }
    
    return price;
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
    <div className="space-y-6">
      <Tabs defaultValue="availability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="availability">Règles de disponibilité</TabsTrigger>
          <TabsTrigger value="booking-options">Options de réservation</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-6">
          <PropertyOptionsManager propertyId={property.id} />
        </TabsContent>

        <TabsContent value="booking-options" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Options et services supplémentaires</CardTitle>
                  <CardDescription className="mt-2">
                    Gérez les options proposées aux clients lors de la réservation
                  </CardDescription>
                </div>
                <Button onClick={() => router.push('/admin/dashboard/booking-options/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle option
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Obligatoire</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {options.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucune option créée pour cette propriété
                        </TableCell>
                      </TableRow>
                    ) : (
                      options.map((option) => (
                        <TableRow key={option.id}>
                          <TableCell className="font-medium">
                            {typeof option.name === 'object' ? (option.name as any).fr || 'Sans nom' : 'Sans nom'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {bookingOptionsService.formatOptionCategory(option.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPrice(option)}</TableCell>
                          <TableCell>{bookingOptionsService.formatPricingType(option.pricingType)}</TableCell>
                          <TableCell>
                            {option.isMandatory ? (
                              <Badge variant="destructive">Obligatoire</Badge>
                            ) : (
                              <Badge variant="outline">Optionnel</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {option.isActive ? (
                              <Badge variant="default">Actif</Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/dashboard/booking-options/${option.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(option.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground">
            <p>💡 Les options de réservation permettent d'ajouter des services supplémentaires comme :</p>
            <ul className="mt-2 ml-6 space-y-1 list-disc">
              <li>Ménage de fin de séjour</li>
              <li>Draps et serviettes</li>
              <li>Petit-déjeuner</li>
              <li>Transfert aéroport</li>
              <li>Location de matériel (vélos, équipements bébé, etc.)</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}