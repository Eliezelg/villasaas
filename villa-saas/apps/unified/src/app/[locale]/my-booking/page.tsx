'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { apiClient } from '@/lib/api-client-booking'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function MyBookingPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    bookingReference: ''
  })

  // Pré-remplir avec les paramètres d'URL si présents
  useEffect(() => {
    const email = searchParams.get('email')
    const reference = searchParams.get('reference')
    
    if (email || reference) {
      setFormData({
        email: email || '',
        bookingReference: reference || ''
      })
      
      // Si les deux sont présents, soumettre automatiquement
      if (email && reference) {
        handleSubmit(new Event('submit') as any)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await apiClient.request<{ 
        booking: any,
        token: string 
      }>('/api/public/bookings/verify', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          reference: formData.bookingReference.toUpperCase().trim()
        })
      })

      if (response.error) {
        if (response.error.includes('not found')) {
          setError(t('booking.myBooking.notFound'))
        } else if (response.error.includes('Too many attempts')) {
          setError(t('booking.myBooking.tooManyAttempts'))
        } else {
          setError(response.error)
        }
      } else if (response.data) {
        // Stocker le token temporaire
        sessionStorage.setItem('booking-token', response.data.token)
        sessionStorage.setItem('booking-id', response.data.booking.id)
        
        // Rediriger vers la page de détails
        router.push(`/${locale}/my-booking/${response.data.booking.id}`)
      }
    } catch (err: any) {
      setError(t('common.messages.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-md">
        <Link 
          href={`/${locale}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8"
        >
          ← {t('common.actions.back')}
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{t('booking.myBooking.title')}</CardTitle>
            <CardDescription>
              {t('booking.myBooking.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('common.labels.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingReference">
                  {t('booking.myBooking.referenceLabel')}
                </Label>
                <Input
                  id="bookingReference"
                  type="text"
                  placeholder="BK-2024-0001"
                  value={formData.bookingReference}
                  onChange={(e) => setFormData({ ...formData, bookingReference: e.target.value })}
                  required
                  disabled={loading}
                  className="uppercase"
                />
                <p className="text-sm text-muted-foreground">
                  {t('booking.myBooking.referenceHelp')}
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.messages.loading')}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {t('booking.myBooking.findBooking')}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t('booking.myBooking.needHelp')}{' '}
              <Link href={`/${locale}/contact`} className="text-primary hover:underline">
                {t('common.navigation.contact')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}