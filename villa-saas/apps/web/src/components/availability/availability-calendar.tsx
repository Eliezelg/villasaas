'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Ban, Home } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { availabilityService, type CalendarDate } from '@/services/availability.service';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityCalendarProps {
  propertyId: string;
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
  selectable?: boolean;
  checkInDays?: number[];
  minNights?: number;
}

export function AvailabilityCalendar({
  propertyId,
  onDateRangeSelect,
  selectable = false,
  checkInDays = [0, 1, 2, 3, 4, 5, 6],
  minNights = 1
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Map<string, CalendarDate>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const { toast } = useToast();

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(addMonths(currentMonth, 2)); // Charger 3 mois

      const { data } = await availabilityService.getAvailabilityCalendar({
        propertyId,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });

      const newMap = new Map<string, CalendarDate>();
      if (data) {
        data.dates.forEach(date => {
          newMap.set(date.date, date);
        });
      }
      setCalendarData(newMap);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le calendrier',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      loadCalendarData();
    }
  }, [propertyId, currentMonth]);

  const handleDateClick = (date: Date) => {
    if (!selectable) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const dateData = calendarData.get(dateStr);
    
    if (!dateData?.available) return;

    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null });
    } else {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else {
        setSelectedRange({ ...selectedRange, end: date });
        if (onDateRangeSelect && selectedRange.start) {
          onDateRangeSelect(selectedRange.start, date);
        }
      }
    }
  };

  const renderMonth = (monthDate: Date) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start, end });

    // Obtenir le premier jour de la semaine
    const firstDayOfWeek = start.getDay();
    const emptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold text-center mb-4">
          {format(monthDate, 'MMMM yyyy', { locale: fr })}
        </h3>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Jours vides au début */}
          {Array.from({ length: emptyDays }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Jours du mois */}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dateData = calendarData.get(dateStr);
            const isSelected = selectedRange.start && selectedRange.end && 
              day >= selectedRange.start && day <= selectedRange.end;
            const isRangeStart = selectedRange.start && isSameDay(day, selectedRange.start);
            const isRangeEnd = selectedRange.end && isSameDay(day, selectedRange.end);
            const dayOfWeek = day.getDay();
            const isCheckInAllowed = checkInDays.includes(dayOfWeek);

            return (
              <div
                key={dateStr}
                onClick={() => handleDateClick(day)}
                className={cn(
                  'aspect-square relative flex flex-col items-center justify-center text-sm rounded-md border cursor-pointer transition-colors',
                  {
                    'bg-gray-100 cursor-not-allowed': !dateData?.available,
                    'hover:bg-accent': dateData?.available && selectable,
                    'bg-primary text-primary-foreground': isSelected,
                    'rounded-l-none': isSelected && !isRangeStart,
                    'rounded-r-none': isSelected && !isRangeEnd,
                    'ring-2 ring-primary': isToday(day),
                    'border-dashed border-2': dateData?.available && !isCheckInAllowed && selectable
                  }
                )}
              >
                <span className="font-medium">{format(day, 'd')}</span>
                
                {dateData && (
                  <>
                    {dateData.reason === 'booked' && (
                      <Home className="w-3 h-3 text-orange-500 absolute bottom-1" />
                    )}
                    {dateData.reason === 'blocked' && (
                      <Ban className="w-3 h-3 text-red-500 absolute bottom-1" />
                    )}
                    {dateData.available && dateData.price && (
                      <span className="text-[10px] text-muted-foreground absolute bottom-0">
                        {Math.round(dateData.price)}€
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendrier de disponibilité
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Aujourd'hui
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-white border rounded" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 border rounded" />
            <span>Non disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <Home className="w-4 h-4 text-orange-500" />
            <span>Réservé</span>
          </div>
          <div className="flex items-center gap-1">
            <Ban className="w-4 h-4 text-red-500" />
            <span>Bloqué</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">
          Chargement du calendrier...
        </div>
      ) : (
        <div className="grid md:grid-cols-3 divide-x">
          {renderMonth(currentMonth)}
          {renderMonth(addMonths(currentMonth, 1))}
          {renderMonth(addMonths(currentMonth, 2))}
        </div>
      )}
    </Card>
  );
}