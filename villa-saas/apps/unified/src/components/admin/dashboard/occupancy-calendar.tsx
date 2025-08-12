'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'

interface OccupiedDate {
  date: string
  propertyName: string
  guestName: string
  status: 'CONFIRMED' | 'PENDING'
}

export function OccupancyCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [occupiedDates, setOccupiedDates] = useState<OccupiedDate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOccupancy()
  }, [selectedDate])

  const loadOccupancy = async () => {
    if (!selectedDate) return
    
    try {
      setLoading(true)
      const start = startOfMonth(selectedDate)
      const end = endOfMonth(selectedDate)
      
      const { data } = await apiClient.get<any>(`/api/bookings/calendar`, {
        params: {
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd')
        }
      })
      
      if (data) {
        // Transformer les données de réservation en dates occupées
        const occupied: OccupiedDate[] = []
        data.bookings?.forEach((booking: any) => {
          const dates = eachDayOfInterval({
            start: new Date(booking.checkIn),
            end: new Date(booking.checkOut)
          })
          
          dates.forEach(date => {
            occupied.push({
              date: format(date, 'yyyy-MM-dd'),
              propertyName: booking.property?.name || 'Propriété',
              guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
              status: booking.status
            })
          })
        })
        
        setOccupiedDates(occupied)
      }
    } catch (error) {
      console.error('Error loading occupancy:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour déterminer si une date est occupée
  const isDateOccupied = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return occupiedDates.some(od => od.date === dateStr)
  }

  // Fonction pour obtenir les réservations d'une date
  const getDateBookings = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return occupiedDates.filter(od => od.date === dateStr)
  }

  // Modifier le style des dates occupées
  const modifiers = {
    occupied: (date: Date) => isDateOccupied(date),
    confirmed: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return occupiedDates.some(od => od.date === dateStr && od.status === 'CONFIRMED')
    },
    pending: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return occupiedDates.some(od => od.date === dateStr && od.status === 'PENDING')
    }
  }

  const modifiersStyles = {
    occupied: {
      backgroundColor: 'rgb(239 68 68)',
      color: 'white',
      fontWeight: 'bold'
    },
    confirmed: {
      backgroundColor: 'rgb(34 197 94)',
      color: 'white',
      fontWeight: 'bold'
    },
    pending: {
      backgroundColor: 'rgb(251 191 36)',
      color: 'white',
      fontWeight: 'bold'
    }
  }

  const selectedBookings = selectedDate ? getDateBookings(selectedDate) : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendrier d'occupation</CardTitle>
        <CardDescription>
          Vue d'ensemble de toutes vos réservations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={fr}
              className="rounded-md border"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              disabled={loading}
            />
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Confirmée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>En attente</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">
              {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: fr }) : 'Sélectionnez une date'}
            </h3>
            
            {selectedBookings.length > 0 ? (
              <div className="space-y-3">
                {selectedBookings.map((booking, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{booking.propertyName}</p>
                      <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                        {booking.status === 'CONFIRMED' ? 'Confirmée' : 'En attente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Client: {booking.guestName}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {selectedDate ? 'Aucune réservation pour cette date' : 'Sélectionnez une date pour voir les réservations'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}