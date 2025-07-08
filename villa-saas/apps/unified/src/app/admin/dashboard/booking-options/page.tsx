'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { bookingOptionsService } from '@/services/booking-options.service';
import type { BookingOption } from '@prisma/client';

export default function BookingOptionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [options, setOptions] = useState<BookingOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOptions();
  }, []);

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

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Options de réservation</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les options et services supplémentaires proposés aux clients
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/dashboard/payment-configuration')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configuration des paiements
          </Button>
          <Button onClick={() => router.push('/admin/dashboard/booking-options/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle option
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
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
                  Aucune option créée
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
      </div>
    </div>
  );
}