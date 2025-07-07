'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, isBefore, addMonths, subMonths, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn, formatPrice } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import * as gtag from '@/lib/gtag'

interface AvailabilityCalendarProps {
  propertyId: string
  basePrice: number
  minNights: number
  onDateSelect?: (checkIn: Date, checkOut: Date) => void
}

interface DayData {
  date: Date
  available: boolean
  price: number
  isBlocked?: boolean
  isBooked?: boolean
  reason?: 'booked' | 'blocked' | 'past'
}

interface PricingPeriod {
  id: string
  startDate: string
  endDate: string
  basePrice: number
  weekendPremium: number
  minNights: number
  name: string
}

export function AvailabilityCalendar({ 
  propertyId, 
  basePrice, 
  minNights,
  onDateSelect 
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(null)
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [monthData, setMonthData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<PricingPeriod[]>([])

  // Charger les données du mois
  useEffect(() => {
    loadMonthData()
  }, [currentMonth, propertyId])

  async function loadMonthData() {
    setLoading(true)
    
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    
    try {
      // Charger les disponibilités du mois avec le nouvel endpoint
      const response = await apiClient.getAvailabilityCalendar(
        propertyId,
        format(monthStart, 'yyyy-MM-dd'),
        format(monthEnd, 'yyyy-MM-dd')
      )
      
      if (response.data) {
        const dayData: DayData[] = response.data.dates.map(day => ({
          date: new Date(day.date),
          available: day.available,
          price: day.price || basePrice,
          isBlocked: day.reason === 'blocked',
          isBooked: day.reason === 'booked',
          reason: day.reason
        }))
        
        setMonthData(dayData)
      }
    } catch (error) {
      console.error('Error loading availability calendar:', error)
      // En cas d'erreur, utiliser les données par défaut
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
      const dayData: DayData[] = days.map(date => ({
        date,
        available: true,
        price: basePrice,
        isBlocked: false,
        isBooked: false
      }))
      setMonthData(dayData)
    } finally {
      setLoading(false)
    }
  }

  function handleDateClick(date: Date) {
    // Track calendar interaction
    gtag.trackCalendarInteraction(propertyId)
    
    // Si pas de check-in sélectionné, ou si on clique sur une date avant le check-in
    if (!selectedCheckIn || isBefore(date, selectedCheckIn)) {
      setSelectedCheckIn(date)
      setSelectedCheckOut(null)
    } 
    // Si on a déjà un check-in, sélectionner le check-out
    else if (!selectedCheckOut) {
      // Vérifier que c'est au moins minNights après le check-in
      const nights = differenceInDays(date, selectedCheckIn)
      if (nights >= minNights) {
        setSelectedCheckOut(date)
        if (onDateSelect) {
          onDateSelect(selectedCheckIn, date)
        }
      }
    }
    // Si on a déjà check-in et check-out, recommencer
    else {
      setSelectedCheckIn(date)
      setSelectedCheckOut(null)
    }
  }

  function isDateDisabled(date: Date): boolean {
    // Désactiver les dates passées
    if (isBefore(date, new Date())) return true
    
    // Si on a sélectionné un check-in, désactiver les dates qui ne respectent pas minNights
    if (selectedCheckIn && !selectedCheckOut) {
      const nights = differenceInDays(date, selectedCheckIn)
      if (nights < minNights && nights > 0) return true
    }
    
    return false
  }

  function isDateInRange(date: Date): boolean {
    if (!selectedCheckIn || !selectedCheckOut) return false
    return isAfter(date, selectedCheckIn) && isBefore(date, selectedCheckOut)
  }

  function getDayPrice(date: Date): number {
    const dayData = monthData.find(d => isSameDay(d.date, date))
    return dayData?.price || basePrice
  }

  const monthDays = monthData.length > 0 ? monthData : 
    eachDayOfInterval({ 
      start: startOfMonth(currentMonth), 
      end: endOfMonth(currentMonth) 
    }).map(date => ({
      date,
      available: true,
      price: basePrice
    }))

  // Ajouter les jours du mois précédent pour compléter la première semaine
  const firstDayOfMonth = startOfMonth(currentMonth)
  const startDay = firstDayOfMonth.getDay() || 7 // Dimanche = 7
  const previousMonthDays = Array.from({ length: startDay - 1 }, (_, i) => {
    const date = new Date(firstDayOfMonth)
    date.setDate(date.getDate() - (startDay - 1 - i))
    return { date, available: false, price: 0 }
  })

  const allDays = [...previousMonthDays, ...monthDays]

  return (
    <div className="w-full">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          disabled={loading}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>
        
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          disabled={loading}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((dayData, index) => {
          const { date, available, price } = dayData
          const isCurrentMonth = isSameMonth(date, currentMonth)
          const isToday = isSameDay(date, new Date())
          const isSelected = selectedCheckIn && isSameDay(date, selectedCheckIn) || 
                           selectedCheckOut && isSameDay(date, selectedCheckOut)
          const isInRange = isDateInRange(date)
          const isDisabled = isDateDisabled(date) || !available || !isCurrentMonth
          const isHovered = hoveredDate && isSameDay(date, hoveredDate)

          return (
            <button
              key={index}
              onClick={() => !isDisabled && isCurrentMonth && handleDateClick(date)}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
              disabled={isDisabled}
              className={cn(
                "relative aspect-square p-1 text-center transition-all",
                "hover:bg-muted/50 rounded-md",
                isCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                isToday && "font-bold",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                isInRange && "bg-primary/10",
                isDisabled && "cursor-not-allowed opacity-50",
                !isDisabled && isCurrentMonth && "cursor-pointer",
                // Styles pour les dates non disponibles
                dayData.isBooked && isCurrentMonth && "bg-red-100 text-red-900 opacity-60",
                dayData.isBlocked && isCurrentMonth && "bg-gray-100 text-gray-500 opacity-60",
                dayData.reason === 'past' && "opacity-30"
              )}
            >
              <div className="text-sm">{format(date, 'd')}</div>
              {isCurrentMonth && available && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatPrice(price, 'EUR').replace(' €', '')}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Légende */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded" />
          <span>Sélectionné</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded border border-red-200" />
          <span>Réservé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded border border-gray-200" />
          <span>Non disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/10 rounded" />
          <span>Période sélectionnée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted rounded" />
          <span>Non disponible</span>
        </div>
      </div>

      {/* Info séjour minimum */}
      {minNights > 1 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
          <p>Séjour minimum : {minNights} nuits</p>
        </div>
      )}

      {/* Résumé de la sélection */}
      {selectedCheckIn && selectedCheckOut && (
        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Période sélectionnée</p>
              <p className="font-medium">
                {format(selectedCheckIn, 'dd MMM', { locale: fr })} - {format(selectedCheckOut, 'dd MMM yyyy', { locale: fr })}
              </p>
              <p className="text-sm text-muted-foreground">
                {differenceInDays(selectedCheckOut, selectedCheckIn)} nuits
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}