'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { apiClient } from '@/lib/api-client-booking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Mail, 
  Phone, 
  Download,
  MessageSquare,
  Edit,
  X,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { PropertyImage } from '@/components/ui/property-image'
import { formatPrice } from '@/lib/utils'

interface Booking {
  id: string
  reference: string
  status: string
  paymentStatus: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  infants: number
  total: number
  currency: string
  guestFirstName: string
  guestLastName: string
  guestEmail: string
  guestPhone: string
  guestCountry?: string
  guestAddress?: string
  specialRequests?: string
  createdAt: string
  property: {
    id: string
    name: string
    address: {
      street: string
      city: string
      postalCode: string
      country: string
    }
    images: Array<{
      id: string
      url: string
      urls?: any
    }>
  }
  tenant: {
    name: string
    logo?: string
    contactEmail?: string
    contactPhone?: string
  }
}

export default function BookingDetailsPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const params = useParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBookingDetails()
  }, [params.id])

  async function loadBookingDetails() {
    const token = sessionStorage.getItem('booking-token')
    const bookingId = sessionStorage.getItem('booking-id')
    
    if (!token || bookingId !== params.id) {
      router.push(`/${locale}/my-booking`)
      return
    }

    try {
      const response = await apiClient.request<Booking>(`/api/public/bookings/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.data) {
        setBooking(response.data)
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token expiré, rediriger vers la page de connexion
        sessionStorage.removeItem('booking-token')
        sessionStorage.removeItem('booking-id')
        router.push(`/${locale}/my-booking`)
      } else {
        setError(t('common.messages.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'CANCELLED':
        return <X className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'CONFIRMED':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || t('common.messages.error')}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => router.push(`/${locale}/my-booking`)}
            className="mt-4"
          >
            {t('common.actions.back')}
          </Button>
        </div>
      </div>
    )
  }

  const totalGuests = booking.adults + booking.children + booking.infants
  const checkInDate = new Date(booking.checkIn)
  const checkOutDate = new Date(booking.checkOut)
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('booking.myBooking.details.title')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('booking.bookingReference')}: <span className="font-semibold">{booking.reference}</span>
            </p>
          </div>
          <Badge variant={getStatusVariant(booking.status)} className="flex items-center gap-1">
            {getStatusIcon(booking.status)}
            {t(`booking.myBooking.statuses.${booking.status}`)}
          </Badge>
        </div>

        {/* Property Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('booking.myBooking.details.property')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                {booking.property.images?.[0] && (
                  <PropertyImage
                    src={booking.property.images[0].urls?.large || booking.property.images[0].url}
                    alt={booking.property.name}
                    className="aspect-video rounded-lg object-cover"
                  />
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{booking.property.name}</h3>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    <p>{booking.property.address.street}</p>
                    <p>{booking.property.address.postalCode} {booking.property.address.city}</p>
                    <p>{booking.property.address.country}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Stay Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('booking.myBooking.details.dates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('booking.hero.checkIn')}</p>
                <p className="font-semibold">
                  {checkInDate.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('booking.hero.checkOut')}</p>
                <p className="font-semibold">
                  {checkOutDate.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('booking.booking.nights', { count: nights })}</span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {t('booking.booking.guests', { count: totalGuests })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('booking.payment.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('booking.myBooking.details.totalAmount')}</span>
                <span className="text-2xl font-bold">{formatPrice(booking.total, booking.currency)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('booking.myBooking.details.paymentStatus')}</span>
                <Badge variant={booking.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                  {t(`booking.myBooking.paymentStatuses.${booking.paymentStatus}`)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guest Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('booking.myBooking.details.guestInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('common.labels.firstName')} {t('common.labels.lastName')}</p>
                <p className="font-semibold">{booking.guestFirstName} {booking.guestLastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('common.labels.email')}</p>
                <p className="font-semibold flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {booking.guestEmail}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('common.labels.phone')}</p>
                <p className="font-semibold flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {booking.guestPhone}
                </p>
              </div>
              {booking.guestCountry && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.labels.country')}</p>
                  <p className="font-semibold">{booking.guestCountry}</p>
                </div>
              )}
            </div>
            
            {booking.specialRequests && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">{t('booking.myBooking.details.specialRequests')}</p>
                <p className="rounded-lg bg-muted p-3">{booking.specialRequests}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                {t('booking.myBooking.details.downloadInvoice')}
              </Button>
              <Button variant="outline" disabled>
                <Edit className="mr-2 h-4 w-4" />
                {t('booking.myBooking.details.modifyBooking')}
              </Button>
              {booking.status === 'CONFIRMED' && (
                <Button variant="outline" disabled>
                  <X className="mr-2 h-4 w-4" />
                  {t('booking.myBooking.details.cancelBooking')}
                </Button>
              )}
              <Button variant="outline" disabled>
                <MessageSquare className="mr-2 h-4 w-4" />
                {t('booking.myBooking.details.contactHost')}
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('booking.myBooking.needHelp')}{' '}
              {booking.tenant.contactEmail && (
                <a href={`mailto:${booking.tenant.contactEmail}`} className="text-primary hover:underline">
                  {booking.tenant.contactEmail}
                </a>
              )}
              {booking.tenant.contactPhone && booking.tenant.contactEmail && ' • '}
              {booking.tenant.contactPhone && (
                <a href={`tel:${booking.tenant.contactPhone}`} className="text-primary hover:underline">
                  {booking.tenant.contactPhone}
                </a>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8">
          <Link href={`/${locale}`}>
            <Button variant="ghost">
              ← {t('common.actions.back')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}