'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWeekend,
  startOfWeek,
  endOfWeek,
  addDays
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { periodsService, type Period } from '@/services/periods.service';
import { cn } from '@/lib/utils';

interface PricingCalendarProps {
  propertyId: string;
  basePrice: number;
  weekendPremium?: number;
}

interface DayPrice {
  date: Date;
  price: number;
  period?: Period;
  isWeekend: boolean;
  weekendPremium: number;
}

export function PricingCalendar({ propertyId, basePrice, weekendPremium = 0 }: PricingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

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

  function getPriceForDate(date: Date): DayPrice {
    // Trouver la période applicable
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

  function renderMonthView() {
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
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const dayPrice = getPriceForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative p-2 border rounded-lg transition-colors",
                    !isCurrentMonth && "opacity-50",
                    isToday && "ring-2 ring-primary",
                    dayPrice.isWeekend && "bg-blue-50 dark:bg-blue-950/20",
                    dayPrice.period && "border-primary/50"
                  )}
                >
                  <div className="text-xs font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="text-sm font-semibold">
                    {dayPrice.price}€
                  </div>
                  {dayPrice.weekendPremium > 0 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayPrice.weekendPremium}€
                    </div>
                  )}
                  {dayPrice.period && (
                    <div 
                      className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"
                      title={dayPrice.period.name}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  function renderYearView() {
    const year = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    return (
      <div className="grid grid-cols-3 gap-4">
        {months.map((monthDate) => {
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
          
          // Calculer le prix moyen du mois
          const prices = days.map(day => getPriceForDate(day).price);
          const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          return (
            <Card 
              key={monthDate.toISOString()} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                setCurrentDate(monthDate);
                setViewMode('month');
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {format(monthDate, 'MMMM', { locale: fr })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{avgPrice}€</div>
                  <div className="text-xs text-muted-foreground">
                    {minPrice}€ - {maxPrice}€
                  </div>
                  <div className="text-xs">
                    Prix moyen / nuit
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calendrier des tarifs</CardTitle>
            <CardDescription>
              Visualisez vos tarifs jour par jour
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Mois
            </Button>
            <Button
              variant={viewMode === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('year')}
            >
              Année
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'month' ? (
          <>
            {/* Navigation du mois */}
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

            {renderMonthView()}

            {/* Légende */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 dark:bg-blue-950/20 border rounded" />
                <span>Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Période spéciale</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary rounded" />
                <span>Aujourd'hui</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Navigation de l'année */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h3 className="text-lg font-semibold">
                {currentDate.getFullYear()}
              </h3>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {renderYearView()}
          </>
        )}

        {/* Périodes actives */}
        {periods.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Périodes tarifaires actives
            </h4>
            <div className="space-y-1">
              {periods.map((period) => (
                <div key={period.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {period.name}
                  </span>
                  <span className="text-muted-foreground">
                    {period.basePrice}€ / nuit
                    {period.weekendPremium > 0 && ` (+${period.weekendPremium}€ weekend)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}