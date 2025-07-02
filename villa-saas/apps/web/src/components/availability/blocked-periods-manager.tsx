'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { availabilityService, type BlockedPeriod } from '@/services/availability.service';
import { useToast } from '@/hooks/use-toast';
import { IcalSync } from './ical-sync';

const blockedPeriodSchema = z.object({
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  reason: z.string().optional(),
  notes: z.string().optional()
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: "La date de fin doit être après la date de début",
  path: ["endDate"]
});

type BlockedPeriodFormData = z.infer<typeof blockedPeriodSchema>;

interface BlockedPeriodsManagerProps {
  propertyId: string;
  onUpdate?: () => void;
}

export function BlockedPeriodsManager({ propertyId, onUpdate }: BlockedPeriodsManagerProps) {
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<BlockedPeriod | null>(null);
  const { toast } = useToast();

  const form = useForm<BlockedPeriodFormData>({
    resolver: zodResolver(blockedPeriodSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      reason: '',
      notes: ''
    }
  });

  const loadBlockedPeriods = async () => {
    try {
      setLoading(true);
      const { data } = await availabilityService.getBlockedPeriods({ propertyId });
      if (data) {
        setBlockedPeriods(data);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les périodes bloquées',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      loadBlockedPeriods();
    }
  }, [propertyId]);

  const handleSubmit = async (data: BlockedPeriodFormData) => {
    try {
      if (editingPeriod) {
        await availabilityService.updateBlockedPeriod(editingPeriod.id, data);
        toast({
          title: 'Succès',
          description: 'Période bloquée mise à jour'
        });
      } else {
        await availabilityService.createBlockedPeriod({
          ...data,
          propertyId
        });
        toast({
          title: 'Succès',
          description: 'Période bloquée créée'
        });
      }
      
      setDialogOpen(false);
      form.reset();
      setEditingPeriod(null);
      loadBlockedPeriods();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.error || 'Une erreur est survenue',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (period: BlockedPeriod) => {
    setEditingPeriod(period);
    form.reset({
      startDate: format(new Date(period.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(period.endDate), 'yyyy-MM-dd'),
      reason: period.reason || '',
      notes: period.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette période bloquée ?')) return;

    try {
      await availabilityService.deleteBlockedPeriod(id);
      toast({
        title: 'Succès',
        description: 'Période bloquée supprimée'
      });
      loadBlockedPeriods();
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la période bloquée',
        variant: 'destructive'
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    form.reset();
    setEditingPeriod(null);
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Périodes bloquées</h3>
            <div className="flex items-center gap-2">
              <IcalSync 
                propertyId={propertyId} 
                onImport={loadBlockedPeriods}
              />
              <Button onClick={() => setDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Bloquer des dates
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Chargement...
            </div>
          ) : blockedPeriods && blockedPeriods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Aucune période bloquée</p>
              <p className="text-sm">Bloquez des dates pour les rendre indisponibles</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedPeriods && blockedPeriods.map(period => (
                  <TableRow key={period.id}>
                    <TableCell>
                      {format(new Date(period.startDate), 'dd MMM yyyy', { locale: fr })}
                      {' → '}
                      {format(new Date(period.endDate), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{period.reason || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {period.notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(period)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(period.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPeriod ? 'Modifier la période bloquée' : 'Bloquer des dates'}
            </DialogTitle>
            <DialogDescription>
              Rendez ces dates indisponibles à la réservation
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raison (optionnel)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Maintenance, Utilisation personnelle..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notes internes..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingPeriod ? 'Mettre à jour' : 'Bloquer les dates'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}