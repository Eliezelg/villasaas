'use client'

import { useState } from 'react'
import { Check, Loader2, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { apiClient } from '@/lib/api-client'
import { formatPrice } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface PromoCodeInputProps {
  propertyId: string
  checkIn: string
  checkOut: string
  totalAmount: number
  nights: number
  onPromoCodeApplied: (promoCode: {
    code: string
    discountAmount: number
    finalAmount: number
  }) => void
}

export function PromoCodeInput({
  propertyId,
  checkIn,
  checkOut,
  totalAmount,
  nights,
  onPromoCodeApplied,
}: PromoCodeInputProps) {
  const t = useTranslations()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(false)
  const [discount, setDiscount] = useState<{
    code: string
    description?: string
    discountType: string
    discountValue: number
    discountAmount: number
    finalAmount: number
  } | null>(null)

  async function handleApplyCode() {
    if (!code.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<any>('/api/public/promocodes/validate', {
        code: code.toUpperCase(),
        propertyId,
        checkIn,
        checkOut,
        totalAmount,
        nights,
      })

      if (response.data && response.data.valid) {
        setDiscount(response.data)
        setApplied(true)
        onPromoCodeApplied({
          code: response.data.code,
          discountAmount: response.data.discountAmount,
          finalAmount: response.data.finalAmount,
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('booking.promocode.invalid'))
    } finally {
      setLoading(false)
    }
  }

  function handleRemoveCode() {
    setCode('')
    setDiscount(null)
    setApplied(false)
    setError(null)
    onPromoCodeApplied({
      code: '',
      discountAmount: 0,
      finalAmount: totalAmount,
    })
  }

  if (applied && discount) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>{discount.code}</strong>
                {discount.description && (
                  <span className="block text-sm">{discount.description}</span>
                )}
              </div>
              <button
                onClick={handleRemoveCode}
                className="text-sm text-green-600 hover:text-green-800 underline"
              >
                {t('common.actions.remove')}
              </button>
            </div>
          </AlertDescription>
        </Alert>

        <div className="rounded-lg bg-green-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span>{t('booking.promocode.discount')}</span>
            <span className="font-semibold text-green-600">
              -{formatPrice(discount.discountAmount)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('booking.promocode.placeholder')}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
            disabled={loading}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleApplyCode}
          disabled={loading || !code.trim()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t('booking.promocode.apply')
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}