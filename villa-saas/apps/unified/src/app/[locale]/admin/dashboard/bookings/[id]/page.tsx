'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Euro,
  FileText,
  MessageSquare,
  Edit,
  Printer,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { bookingService, type Booking } from '@/services/booking.service';

const statusConfig = {
  PENDING: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  CONFIRMED: {
    label: 'Confirmée',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'Annulée',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  COMPLETED: {
    label: 'Terminée',
    color: 'bg-gray-100 text-gray-800',
    icon: CheckCircle
  },
  NO_SHOW: {
    label: 'No-show',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle
  }
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    if (params.id) {
      loadBooking();
    }
  }, [params.id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const { data } = await bookingService.getById(params.id as string);
      if (data) {
        setBooking(data);
        setInternalNotes(data.internalNotes || '');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la réservation',
        variant: 'destructive'
      });
      router.push('/dashboard/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!booking) return;
    
    try {
      setUpdating(true);
      await bookingService.confirm(booking.id);
      toast({
        title: 'Réservation confirmée',
        description: 'La réservation a été confirmée avec succès'
      });
      loadBooking();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de confirmer la réservation',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      setUpdating(true);
      await bookingService.cancel(booking.id, 'Annulée par le propriétaire');
      toast({
        title: 'Réservation annulée',
        description: 'La réservation a été annulée'
      });
      loadBooking();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler la réservation',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!booking) return;

    try {
      setUpdating(true);
      await bookingService.update(booking.id, { internalNotes });
      toast({
        title: 'Notes mises à jour',
        description: 'Les notes internes ont été enregistrées'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les notes',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const StatusIcon = statusConfig[booking.status].icon;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/bookings')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Réservation {booking.reference}</h1>
            <p className="text-muted-foreground">
              Créée le {format(new Date(booking.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={statusConfig[booking.status].color}>
            <StatusIcon className="mr-1 h-4 w-4" />
            {statusConfig[booking.status].label}
          </Badge>
          
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails de la réservation */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du séjour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{booking.property?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.property?.address}, {booking.property?.city}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Arrivée</p>
                    <p className="font-medium">
                      {format(new Date(booking.checkIn), 'EEEE dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Départ</p>
                    <p className="font-medium">
                      {format(new Date(booking.checkOut), 'EEEE dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p>{booking.nights} {booking.nights > 1 ? 'nuits' : 'nuit'}</p>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {booking.adults} {booking.adults > 1 ? 'adultes' : 'adulte'}
                    {booking.children > 0 && `, ${booking.children} ${booking.children > 1 ? 'enfants' : 'enfant'}`}
                  </p>
                  {booking.infants > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {booking.infants} {booking.infants > 1 ? 'bébés' : 'bébé'}
                    </p>
                  )}
                  {booking.pets > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {booking.pets} {booking.pets > 1 ? 'animaux' : 'animal'}
                    </p>
                  )}
                </div>
              </div>

              {booking.specialRequests && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Demandes spéciales</p>
                      <p className="text-sm">{booking.specialRequests}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {booking.guestFirstName} {booking.guestLastName}
                  </p>
                  {booking.guestCountry && (
                    <p className="text-sm text-muted-foreground">Pays : {booking.guestCountry}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href={`mailto:${booking.guestEmail}`} className="text-primary hover:underline">
                  {booking.guestEmail}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <a href={`tel:${booking.guestPhone}`} className="text-primary hover:underline">
                  {booking.guestPhone}
                </a>
              </div>

              {booking.guestAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">{booking.guestAddress}</p>
                </div>
              )}

              {booking.guestNotes && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes client</p>
                      <p className="text-sm">{booking.guestNotes}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes internes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes internes</CardTitle>
              <CardDescription>
                Ces notes ne sont visibles que par vous
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ajoutez des notes internes..."
                rows={4}
              />
              <Button 
                onClick={handleUpdateNotes}
                disabled={updating || internalNotes === booking.internalNotes}
              >
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer les notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Actions */}
          {['PENDING', 'CONFIRMED'].includes(booking.status) && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.status === 'PENDING' && (
                  <Button 
                    onClick={handleConfirm} 
                    className="w-full"
                    disabled={updating}
                  >
                    {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmer la réservation
                  </Button>
                )}
                
                <Button 
                  onClick={handleCancel} 
                  variant="destructive" 
                  className="w-full"
                  disabled={updating}
                >
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <XCircle className="mr-2 h-4 w-4" />
                  Annuler la réservation
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Détails financiers */}
          <Card>
            <CardHeader>
              <CardTitle>Détails financiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Hébergement</span>
                  <span>{formatPrice(booking.accommodationTotal)}</span>
                </div>
                {booking.cleaningFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Frais de ménage</span>
                    <span>{formatPrice(booking.cleaningFee)}</span>
                  </div>
                )}
                {booking.touristTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxe de séjour</span>
                    <span>{formatPrice(booking.touristTax)}</span>
                  </div>
                )}
                {booking.extraFees?.map((fee: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{fee.name}</span>
                    <span>{formatPrice(fee.amount)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total</span>
                  <span>{formatPrice(booking.subtotal)}</span>
                </div>
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Réduction</span>
                    <span>-{formatPrice(booking.discountAmount)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(booking.total)}</span>
              </div>

              <div className="pt-4 space-y-2 border-t">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Commission ({(0.15 * 100)}%)</span>
                  <span>{formatPrice(booking.commissionAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Montant net</span>
                  <span>{formatPrice(booking.payoutAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations supplémentaires */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {booking.source && (
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p className="font-medium capitalize">{booking.source}</p>
                </div>
              )}
              {booking.externalId && (
                <div>
                  <p className="text-muted-foreground">ID externe</p>
                  <p className="font-medium">{booking.externalId}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Statut paiement</p>
                <p className="font-medium">{booking.paymentStatus}</p>
              </div>
              {booking.cancellationDate && (
                <div>
                  <p className="text-muted-foreground">Date d'annulation</p>
                  <p className="font-medium">
                    {format(new Date(booking.cancellationDate), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              )}
              {booking.cancellationReason && (
                <div>
                  <p className="text-muted-foreground">Raison d'annulation</p>
                  <p className="font-medium">{booking.cancellationReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}