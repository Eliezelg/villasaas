'use client';

import { useState, useEffect } from 'react';
import { Calendar, Save, X, AlertCircle } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { periodsService, type CreatePeriodData, type Period } from '@/services/periods.service';

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
  const [action, setAction] = useState<'create' | 'update'>(existingPeriod ? 'update' : 'create');
  const [allPeriods, setAllPeriods] = useState<Period[]>([]);
  const [formData, setFormData] = useState({
    name: existingPeriod?.name || '',
    basePrice: existingPeriod?.basePrice || 100,
    weekendPremium: existingPeriod?.weekendPremium || 0,
    minNights: existingPeriod?.minNights || 1,
    priority: 10, // Par défaut
  });

  const startDate = selectedDates[0];
  const endDate = selectedDates[selectedDates.length - 1];

  useEffect(() => {
    loadAllPeriods();
  }, [propertyId]);

  async function loadAllPeriods() {
    const { data } = await periodsService.getAll(propertyId);
    if (data) {
      setAllPeriods(data);
      
      // Calculer la priorité pour une nouvelle période
      if (!existingPeriod || action === 'create') {
        // Trouver la priorité maximale des périodes qui chevauchent
        const overlappingPeriods = data.filter(period => {
          const periodStart = new Date(period.startDate);
          const periodEnd = new Date(period.endDate);
          return (
            (startDate >= periodStart && startDate <= periodEnd) ||
            (endDate >= periodStart && endDate <= periodEnd) ||
            (startDate <= periodStart && endDate >= periodEnd)
          );
        });
        
        const maxPriority = overlappingPeriods.length > 0
          ? Math.max(...overlappingPeriods.map(p => p.priority))
          : 0;
        
        setFormData(prev => ({ ...prev, priority: maxPriority + 10 }));
      }
    }
  }

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
        priority: formData.priority,
        isActive: true,
      };

      if (existingPeriod && action === 'update') {
        await periodsService.update(existingPeriod.id, periodData);
        toast({
          title: 'Période modifiée',
          description: 'Les tarifs ont été mis à jour',
        });
      } else {
        await periodsService.create(periodData);
        toast({
          title: 'Période créée',
          description: 'La nouvelle période tarifaire a été créée avec une priorité plus élevée',
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingPeriod && action === 'update' ? 'Modifier la période' : 'Créer une période tarifaire'}
          </DialogTitle>
          <DialogDescription>
            Du {format(startDate, 'dd MMMM', { locale: fr })} au{' '}
            {format(endDate, 'dd MMMM yyyy', { locale: fr })}
            <br />
            ({selectedDates.length} {selectedDates.length > 1 ? 'jours' : 'jour'})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {existingPeriod && (
            <div className="space-y-3">
              <Label>Action à effectuer</Label>
              <RadioGroup value={action} onValueChange={(value) => setAction(value as 'create' | 'update')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update" id="update" />
                  <Label htmlFor="update" className="font-normal cursor-pointer">
                    Modifier la période existante "{existingPeriod.name}"
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="create" id="create" />
                  <Label htmlFor="create" className="font-normal cursor-pointer">
                    Créer une nouvelle période prioritaire
                  </Label>
                </div>
              </RadioGroup>
              
              {action === 'create' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    La nouvelle période aura une priorité de {formData.priority}, ce qui remplacera les tarifs existants pour ces dates.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom de la période</Label>
            <Input
              id="name"
              placeholder="Ex: Promotion spéciale"
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

          <div className="grid grid-cols-2 gap-4">
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

            {action === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            )}
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