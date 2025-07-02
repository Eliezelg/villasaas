'use client';

import { useState } from 'react';
import { Calendar, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { periodsService, type CreatePeriodData } from '@/services/periods.service';

interface QuickPriceEditorProps {
  propertyId: string;
  selectedDates: Date[];
  onClose: () => void;
  onSave: () => void;
  existingPeriod?: {
    id: string;
    name: string;
    basePrice: number;
    weekendPremium: number;
    minNights: number;
  };
}

export function QuickPriceEditor({
  propertyId,
  selectedDates,
  onClose,
  onSave,
  existingPeriod,
}: QuickPriceEditorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: existingPeriod?.name || '',
    basePrice: existingPeriod?.basePrice || 100,
    weekendPremium: existingPeriod?.weekendPremium || 0,
    minNights: existingPeriod?.minNights || 1,
  });

  const startDate = selectedDates[0];
  const endDate = selectedDates[selectedDates.length - 1];

  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de la période est requis',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const periodData: CreatePeriodData = {
        propertyId,
        name: formData.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        basePrice: formData.basePrice,
        weekendPremium: formData.weekendPremium,
        minNights: formData.minNights,
        priority: 5, // Priorité moyenne par défaut
        isActive: true,
      };

      if (existingPeriod) {
        await periodsService.update(existingPeriod.id, periodData);
        toast({
          title: 'Période modifiée',
          description: 'Les tarifs ont été mis à jour',
        });
      } else {
        await periodsService.create(periodData);
        toast({
          title: 'Période créée',
          description: 'La nouvelle période tarifaire a été créée',
        });
      }

      onSave();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder la période',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingPeriod ? 'Modifier la période' : 'Créer une période tarifaire'}
          </DialogTitle>
          <DialogDescription>
            Du {format(startDate, 'dd MMMM', { locale: fr })} au{' '}
            {format(endDate, 'dd MMMM yyyy', { locale: fr })}
            <br />
            ({selectedDates.length} {selectedDates.length > 1 ? 'jours' : 'jour'})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la période</Label>
            <Input
              id="name"
              placeholder="Ex: Vacances de Noël"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Prix par nuit (€)</Label>
              <Input
                id="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekendPremium">Supplément weekend (€)</Label>
              <Input
                id="weekendPremium"
                type="number"
                min="0"
                step="0.01"
                value={formData.weekendPremium}
                onChange={(e) =>
                  setFormData({ ...formData, weekendPremium: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minNights">Séjour minimum (nuits)</Label>
            <Input
              id="minNights"
              type="number"
              min="1"
              value={formData.minNights}
              onChange={(e) =>
                setFormData({ ...formData, minNights: parseInt(e.target.value) || 1 })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}