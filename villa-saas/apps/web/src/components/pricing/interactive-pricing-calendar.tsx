'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWeekend,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  isBefore,
  isAfter
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { periodsService, type Period } from '@/services/periods.service';
import { QuickPriceEditor } from './quick-price-editor';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface InteractivePricingCalendarProps {
  propertyId: string;
  basePrice: number;
  weekendPremium?: number;
}

interface DayInfo {
  date: Date;
  price: number;
  period?: Period;
  isWeekend: boolean;
  weekendPremium: number;
}

export function InteractivePricingCalendar({ 
  propertyId, 
  basePrice, 
  weekendPremium = 0 
}: InteractivePricingCalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | undefined>();

  useEffect(() => {
    loadPeriods();
  }, [propertyId]);

  async function loadPeriods() {
    setIsLoading(true);
    const { data } = await periodsService.getAll(propertyId);
    if (data) {
      setPeriods(data.filter(p => p.isActive));
    }
    setIsLoading(false);
  }

  function getPriceForDate(date: Date): DayInfo {
    const applicablePeriod = periods
      .sort((a, b) => b.priority - a.priority)
      .find(period => {
        const periodStart = new Date(period.startDate);
        const periodEnd = new Date(period.endDate);
        return date >= periodStart && date <= periodEnd;
      });

    const isWeekendDay = isWeekend(date);
    const dayBasePrice = applicablePeriod?.basePrice || basePrice;
    const dayWeekendPremium = applicablePeriod?.weekendPremium ?? weekendPremium;
    const finalWeekendPremium = isWeekendDay ? dayWeekendPremium : 0;

    return {
      date,
      price: dayBasePrice + finalWeekendPremium,
      period: applicablePeriod,
      isWeekend: isWeekendDay,
      weekendPremium: finalWeekendPremium,
    };
  }

  function handleDayClick(date: Date) {
    if (!selectionStart) {
      // Première sélection
      setSelectionStart(date);
      setSelectedDates([date]);
    } else {
      // Deuxième sélection - créer une plage
      const start = isBefore(date, selectionStart) ? date : selectionStart;
      const end = isAfter(date, selectionStart) ? date : selectionStart;
      
      const range = eachDayOfInterval({ start, end });
      setSelectedDates(range);
      setSelectionStart(null);
      
      // Vérifier si toutes les dates appartiennent à la même période
      const dayInfos = range.map(d => getPriceForDate(d));
      const uniquePeriodIds = Array.from(new Set(dayInfos.map(d => d.period?.id).filter(Boolean)));
      
      if (uniquePeriodIds.length === 1 && uniquePeriodIds[0]) {
        // Toutes les dates sont dans la même période existante
        const period = periods.find(p => p.id === uniquePeriodIds[0]);
        setEditingPeriod(period);
      } else {
        setEditingPeriod(undefined);
      }
      
      setShowEditor(true);
    }
  }

  function handleCancelSelection() {
    setSelectionStart(null);
    setSelectedDates([]);
  }

  function handleEditorClose() {
    setShowEditor(false);
    setSelectionStart(null);
    setSelectedDates([]);
    setEditingPeriod(undefined);
  }

  function handleEditorSave() {
    handleEditorClose();
    loadPeriods();
  }

  function renderMonth() {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks: Date[][] = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const dayInfo = getPriceForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDates.some(d => isSameDay(d, day));
              const isPastDate = isBefore(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !isPastDate && handleDayClick(day)}
                  disabled={isPastDate}
                  className={cn(
                    "relative p-2 border rounded-lg transition-all",
                    !isCurrentMonth && "opacity-50",
                    isToday && "ring-2 ring-primary",
                    dayInfo.isWeekend && "bg-blue-50 dark:bg-blue-950/20",
                    dayInfo.period && "border-primary/50",
                    isSelected && "bg-primary/20 border-primary",
                    isPastDate && "opacity-30 cursor-not-allowed",
                    !isPastDate && "hover:bg-muted cursor-pointer"
                  )}
                >
                  <div className="text-xs font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="text-sm font-semibold">
                    {dayInfo.price}€
                  </div>
                  {dayInfo.weekendPremium > 0 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayInfo.weekendPremium}€
                    </div>
                  )}
                  {dayInfo.period && (
                    <div 
                      className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"
                      title={dayInfo.period.name}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Chargement du calendrier...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendrier interactif des tarifs</CardTitle>
              <CardDescription>
                Cliquez sur deux dates pour créer ou modifier une période tarifaire
              </CardDescription>
            </div>
            {selectionStart && (
              <Button variant="outline" size="sm" onClick={handleCancelSelection}>
                Annuler la sélection
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h3 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h3>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {renderMonth()}

          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {selectionStart ? (
                <>
                  <span className="font-medium">Mode sélection:</span> Cliquez sur une autre date pour définir la fin de la période
                </>
              ) : (
                'Cliquez sur une date pour commencer la sélection'
              )}
            </p>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 dark:bg-blue-950/20 border rounded" />
                <span>Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Période existante</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary/20 border-primary border rounded" />
                <span>Sélection</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showEditor && (
        <QuickPriceEditor
          propertyId={propertyId}
          selectedDates={selectedDates}
          onClose={handleEditorClose}
          onSave={handleEditorSave}
          existingPeriod={editingPeriod ? {
            id: editingPeriod.id,
            name: editingPeriod.name,
            basePrice: editingPeriod.basePrice,
            weekendPremium: editingPeriod.weekendPremium,
            minNights: editingPeriod.minNights,
          } : undefined}
        />
      )}
    </>
  );
}