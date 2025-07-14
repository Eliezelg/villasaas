'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Home,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { bookingService, type Booking } from '@/services/booking.service';
import { propertyService } from '@/services/property.service';

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

export default function BookingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    propertyId: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filters]);

  const loadProperties = async () => {
    try {
      const response = await propertyService.getAll({ limit: 100 });
      if (response.properties) {
        setProperties(response.properties);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const { data } = await bookingService.list({
        ...filters,
        propertyId: filters.propertyId === 'all' ? undefined : filters.propertyId,
        status: filters.status === 'all' ? undefined : filters.status as Booking['status']
      });
      if (data) {
        setBookings(data.bookings);
        setPagination(data.pagination);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les réservations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleConfirm = async (booking: Booking) => {
    try {
      await bookingService.confirm(booking.id);
      toast({
        title: 'Réservation confirmée',
        description: `La réservation ${booking.reference} a été confirmée`
      });
      loadBookings();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de confirmer la réservation',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      await bookingService.cancel(booking.id, 'Annulée par le propriétaire');
      toast({
        title: 'Réservation annulée',
        description: `La réservation ${booking.reference} a été annulée`
      });
      loadBookings();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler la réservation',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Réservations</h1>
          <p className="text-muted-foreground">Gérez vos réservations</p>
        </div>
        <Button onClick={() => router.push('/dashboard/bookings/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle réservation
        </Button>
      </div>

      {/* Filtres */}
      <Card className="p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher (référence, nom, email)"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.propertyId}
              onValueChange={(value) => setFilters({ ...filters, propertyId: value, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les propriétés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les propriétés</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit">
              <Filter className="mr-2 h-4 w-4" />
              Filtrer
            </Button>
          </div>
        </form>
      </Card>

      {/* Tableau des réservations */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Propriété</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Invités</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const StatusIcon = statusConfig[booking.status].icon;
              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.reference}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.property?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {booking.guestFirstName} {booking.guestLastName}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {booking.guestEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.guestPhone}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(booking.checkIn), 'dd MMM', { locale: fr })} - 
                        {format(new Date(booking.checkOut), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.nights} {booking.nights > 1 ? 'nuits' : 'nuit'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {booking.adults + booking.children}
                        {booking.infants > 0 && ` (+${booking.infants} bébé${booking.infants > 1 ? 's' : ''})`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(booking.total)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[booking.status].color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusConfig[booking.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        {booking.status === 'PENDING' && (
                          <DropdownMenuItem
                            onClick={() => handleConfirm(booking)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirmer
                          </DropdownMenuItem>
                        )}
                        {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                          <DropdownMenuItem
                            onClick={() => handleCancel(booking)}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Annuler
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune réservation trouvée</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} sur {pagination.pages} ({pagination.total} résultats)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === pagination.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}