'use client';

import { useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PriceCalculatorProps {
  propertyId: string;
  basePrice: number;
  cleaningFee?: number;
  maxGuests: number;
  minNights: number;
}

interface PricingDetails {
  nights: number;
  totalAccommodation: number;
  weekendPremium: number;
  longStayDiscount: number;
  cleaningFee: number;
  touristTax: number;
  total: number;
  averagePricePerNight: number;
}

export function PriceCalculator({ 
  propertyId, 
  basePrice, 
  cleaningFee, 
  maxGuests,
  minNights
}: PriceCalculatorProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [pricing, setPricing] = useState<PricingDetails | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function calculatePrice() {
    if (!checkIn || !checkOut) {
      setError('Veuillez sélectionner les dates');
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = differenceInDays(checkOutDate, checkInDate);

    if (nights < minNights) {
      setError(`Séjour minimum de ${minNights} nuits`);
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const response = await apiClient.post<PricingDetails>('/pricing/calculate', {
        propertyId,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        guests,
      });

      if (response.data) {
        setPricing(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du calcul');
    } finally {
      setIsCalculating(false);
    }
  }

  const nights = checkIn && checkOut 
    ? differenceInDays(new Date(checkOut), new Date(checkIn))
    : 0;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-bold">
            {basePrice} €
            <span className="text-base font-normal text-muted-foreground"> / nuit</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="checkIn">Arrivée</Label>
            <Input
              id="checkIn"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="checkOut">Départ</Label>
            <Input
              id="checkOut"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="guests">Voyageurs</Label>
            <Input
              id="guests"
              type="number"
              min="1"
              max={maxGuests}
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum {maxGuests} voyageurs
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive">
            {error}
          </div>
        )}

        <Button 
          className="w-full" 
          size="lg"
          onClick={calculatePrice}
          disabled={isCalculating || !checkIn || !checkOut}
        >
          {isCalculating ? 'Calcul en cours...' : 'Calculer le prix'}
        </Button>

        {pricing && (
          <>
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{pricing.totalAccommodation} € x {pricing.nights} nuits</span>
                <span>{pricing.totalAccommodation} €</span>
              </div>
              
              {pricing.weekendPremium > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Supplément weekend</span>
                  <span>+{pricing.weekendPremium} €</span>
                </div>
              )}
              
              {pricing.longStayDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Réduction long séjour</span>
                  <span>-{pricing.longStayDiscount} €</span>
                </div>
              )}
              
              {pricing.cleaningFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Frais de ménage</span>
                  <span>{pricing.cleaningFee} €</span>
                </div>
              )}
              
              {pricing.touristTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Taxe de séjour</span>
                  <span>{pricing.touristTax} €</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{pricing.total} €</span>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Soit {pricing.averagePricePerNight} € par nuit en moyenne
            </p>
          </>
        )}
      </div>
    </Card>
  );
}