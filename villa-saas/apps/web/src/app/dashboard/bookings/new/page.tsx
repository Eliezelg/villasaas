'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  Home,
  Calculator,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { bookingService, type PriceCalculation } from '@/services/booking.service';
import { propertyService } from '@/services/property.service';

const bookingSchema = z.object({
  propertyId: z.string().min(1, 'Sélectionnez une propriété'),
  checkIn: z.string().min(1, 'Date d\'arrivée requise'),
  checkOut: z.string().min(1, 'Date de départ requise'),
  adults: z.coerce.number().min(1, 'Au moins 1 adulte requis'),
  children: z.coerce.number().min(0),
  infants: z.coerce.number().min(0),
  pets: z.coerce.number().min(0),
  guestFirstName: z.string().min(1, 'Prénom requis'),
  guestLastName: z.string().min(1, 'Nom requis'),
  guestEmail: z.string().email('Email invalide'),
  guestPhone: z.string().min(1, 'Téléphone requis'),
  guestCountry: z.string().optional(),
  guestAddress: z.string().optional(),
  guestNotes: z.string().optional(),
  specialRequests: z.string().optional(),
}).refine((data) => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  return checkOut > checkIn;
}, {
  message: 'La date de départ doit être après la date d\'arrivée',
  path: ['checkOut']
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function NewBookingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [creating, setCreating] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      propertyId: '',
      checkIn: '',
      checkOut: '',
      adults: 1,
      children: 0,
      infants: 0,
      pets: 0,
      guestFirstName: '',
      guestLastName: '',
      guestEmail: '',
      guestPhone: '',
      guestCountry: 'FR',
      guestAddress: '',
      guestNotes: '',
      specialRequests: '',
    }
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    const propertyId = form.watch('propertyId');
    if (propertyId) {
      const property = properties.find(p => p.id === propertyId);
      setSelectedProperty(property);
    }
  }, [form.watch('propertyId'), properties]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (['propertyId', 'checkIn', 'checkOut', 'adults', 'children', 'infants', 'pets'].includes(name || '')) {
        if (value.propertyId && value.checkIn && value.checkOut) {
          calculatePrice();
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const loadProperties = async () => {
    try {
      const { data } = await propertyService.list({ status: 'PUBLISHED', limit: 100 });
      if (data?.properties) {
        setProperties(data.properties);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les propriétés',
        variant: 'destructive'
      });
    }
  };

  const calculatePrice = async () => {
    const values = form.getValues();
    if (!values.propertyId || !values.checkIn || !values.checkOut) return;

    try {
      setCalculatingPrice(true);
      const { data } = await bookingService.calculatePrice({
        propertyId: values.propertyId,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        adults: values.adults,
        children: values.children,
        infants: values.infants,
        pets: values.pets
      });

      if (data) {
        setPriceCalculation(data);
        if (!data.available) {
          form.setError('checkIn', { message: data.error || 'Dates non disponibles' });
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors du calcul du prix';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setCalculatingPrice(false);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!priceCalculation || !priceCalculation.available) {
      toast({
        title: 'Erreur',
        description: 'Veuillez vérifier la disponibilité',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreating(true);
      const { data: booking } = await bookingService.create(data);
      if (booking) {
        toast({
          title: 'Réservation créée',
          description: `Réservation ${booking.reference} créée avec succès`
        });
        router.push(`/dashboard/bookings/${booking.id}`);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.error || 'Erreur lors de la création',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/bookings')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouvelle réservation</h1>
          <p className="text-muted-foreground">Créez une réservation manuelle</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Sélection de la propriété et dates */}
          <Card>
            <CardHeader>
              <CardTitle>Propriété et dates</CardTitle>
              <CardDescription>
                Sélectionnez la propriété et les dates du séjour
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propriété</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une propriété" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>{property.name}</span>
                              <span className="text-muted-foreground">
                                ({property.city})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedProperty && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">{selectedProperty.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProperty.address}, {selectedProperty.city}
                      </p>
                      <p className="text-sm">
                        Capacité max: {selectedProperty.maxGuests} personnes
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="checkIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'arrivée</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de départ</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="adults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adultes</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="children"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enfants</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>2-12 ans</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="infants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bébés</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>&lt; 2 ans</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Animaux</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Calcul du prix */}
          {priceCalculation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Détail du prix
                </CardTitle>
              </CardHeader>
              <CardContent>
                {priceCalculation.available ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Hébergement ({priceCalculation.nights} nuits)</span>
                        <span>{formatPrice(priceCalculation.accommodationTotal)}</span>
                      </div>
                      {priceCalculation.cleaningFee > 0 && (
                        <div className="flex justify-between">
                          <span>Frais de ménage</span>
                          <span>{formatPrice(priceCalculation.cleaningFee)}</span>
                        </div>
                      )}
                      {priceCalculation.touristTax > 0 && (
                        <div className="flex justify-between">
                          <span>Taxe de séjour</span>
                          <span>{formatPrice(priceCalculation.touristTax)}</span>
                        </div>
                      )}
                      {priceCalculation.extraFees?.map((fee: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{fee.name}</span>
                          <span>{formatPrice(fee.amount)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Sous-total</span>
                        <span>{formatPrice(priceCalculation.subtotal)}</span>
                      </div>
                      {priceCalculation.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Réduction long séjour</span>
                          <span>-{formatPrice(priceCalculation.discountAmount)}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(priceCalculation.total)}</span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Commission plateforme : {formatPrice(priceCalculation.commission.amount)} ({priceCalculation.commission.rate * 100}%)
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {priceCalculation.error || 'Ces dates ne sont pas disponibles'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du client</CardTitle>
              <CardDescription>
                Renseignez les coordonnées du client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guestFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guestLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guestEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guestPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="guestCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="CH">Suisse</SelectItem>
                        <SelectItem value="DE">Allemagne</SelectItem>
                        <SelectItem value="ES">Espagne</SelectItem>
                        <SelectItem value="IT">Italie</SelectItem>
                        <SelectItem value="GB">Royaume-Uni</SelectItem>
                        <SelectItem value="US">États-Unis</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guestAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guestNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes internes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Notes sur le client (non visibles par le client)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Demandes spéciales</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Demandes spéciales du client"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/bookings')}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={creating || calculatingPrice || !priceCalculation?.available}
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer la réservation
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}