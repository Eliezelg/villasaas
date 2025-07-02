'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { periodsService, type Period, type CreatePeriodData } from '@/services/periods.service';
import { PeriodForm } from './period-form';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PeriodsManagerProps {
  propertyId?: string;
  propertyName?: string;
}

export function PeriodsManager({ propertyId, propertyName }: PeriodsManagerProps) {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPeriods();
  }, [propertyId]);

  async function loadPeriods() {
    setIsLoading(true);
    const { data, error } = await periodsService.getAll(propertyId);
    
    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les périodes tarifaires',
        variant: 'destructive',
      });
    } else if (data) {
      setPeriods(data);
    }
    
    setIsLoading(false);
  }

  async function handleSave(data: CreatePeriodData) {
    const periodData = {
      ...data,
      propertyId,
    };

    if (editingPeriod) {
      const { error } = await periodsService.update(editingPeriod.id, periodData);
      
      if (!error) {
        toast({
          title: 'Période modifiée',
          description: 'La période tarifaire a été mise à jour',
        });
        setEditingPeriod(null);
        setShowForm(false);
        loadPeriods();
      } else {
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de modifier la période',
          variant: 'destructive',
        });
      }
    } else {
      const { error } = await periodsService.create(periodData);
      
      if (!error) {
        toast({
          title: 'Période créée',
          description: 'La nouvelle période tarifaire a été créée',
        });
        setShowForm(false);
        loadPeriods();
      } else {
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de créer la période',
          variant: 'destructive',
        });
      }
    }
  }

  async function handleDelete(period: Period) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la période "${period.name}" ?`)) {
      return;
    }

    const { error } = await periodsService.delete(period.id);
    
    if (!error) {
      toast({
        title: 'Période supprimée',
        description: 'La période tarifaire a été supprimée',
      });
      loadPeriods();
    } else {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la période',
        variant: 'destructive',
      });
    }
  }

  function toggleExpanded(periodId: string) {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(periodId)) {
      newExpanded.delete(periodId);
    } else {
      newExpanded.add(periodId);
    }
    setExpandedPeriods(newExpanded);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Chargement des périodes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Périodes tarifaires</CardTitle>
            <CardDescription>
              {propertyName 
                ? `Gérez les tarifs par période pour ${propertyName}`
                : 'Gérez vos tarifs par période (haute saison, basse saison, etc.)'
              }
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingPeriod(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle période
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-6">
            <PeriodForm
              period={editingPeriod}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingPeriod(null);
              }}
            />
          </div>
        )}

        {periods.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucune période tarifaire définie</p>
            {!showForm && (
              <Button
                variant="outline"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer votre première période
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {periods.map((period) => {
              const isExpanded = expandedPeriods.has(period.id);
              
              return (
                <div
                  key={period.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleExpanded(period.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{period.name}</h4>
                            {period.priority > 0 && (
                              <Badge variant="secondary">
                                Priorité {period.priority}
                              </Badge>
                            )}
                            {!period.isActive && (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Du {format(new Date(period.startDate), 'dd MMMM yyyy', { locale: fr })} au{' '}
                            {format(new Date(period.endDate), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPeriod(period);
                          setShowForm(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(period)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pl-9 grid gap-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground">Prix de base</p>
                          <p className="font-medium">{period.basePrice} € / nuit</p>
                        </div>
                        {period.weekendPremium > 0 && (
                          <div>
                            <p className="text-muted-foreground">Supplément weekend</p>
                            <p className="font-medium">+{period.weekendPremium} €</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Séjour minimum</p>
                          <p className="font-medium">{period.minNights} {period.minNights > 1 ? 'nuits' : 'nuit'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}