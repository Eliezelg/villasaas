'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown, Users, Euro, Calendar, Home } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { analyticsService } from '@/services/analytics.service';
import { propertyService } from '@/services/property.service';
import { useToast } from '@/hooks/use-toast';
import type { OverviewData, OccupancyData, RevenueData } from '@/services/analytics.service';
import type { Property } from '@/types/property';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(subMonths(new Date(), 2)),
    to: endOfMonth(new Date())
  });
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [properties, setProperties] = useState<Property[]>([]);
  
  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);

  // Load properties
  useEffect(() => {
    loadProperties();
  }, []);

  // Load analytics data when filters change
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      loadAnalyticsData();
    }
  }, [dateRange, selectedPropertyId]);

  const loadProperties = async () => {
    try {
      const response = await propertyService.getAll();
      if (response.properties) {
        setProperties(response.properties);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const filters = {
        startDate: dateRange.from?.toISOString(),
        endDate: dateRange.to?.toISOString(),
        propertyId: selectedPropertyId !== 'all' ? selectedPropertyId : undefined
      };

      const [overviewRes, occupancyRes, revenueRes] = await Promise.all([
        analyticsService.getOverview(filters),
        analyticsService.getOccupancy(filters),
        analyticsService.getRevenue(filters)
      ]);

      if (overviewRes.data) setOverview(overviewRes.data);
      if (occupancyRes.data) setOccupancy(occupancyRes.data);
      if (revenueRes.data) setRevenue(revenueRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const filters = {
        startDate: dateRange.from?.toISOString(),
        endDate: dateRange.to?.toISOString(),
        propertyId: selectedPropertyId !== 'all' ? selectedPropertyId : undefined
      };
      
      await analyticsService.exportData(filters);
      toast({
        title: 'Export réussi',
        description: 'Les données ont été exportées avec succès'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter les données",
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Analysez les performances de vos propriétés
          </p>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-[200px]">
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
          
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(overview?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(revenue?.averageRevenuePerNight || 0)} / nuit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Réservations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.totalBookings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {overview?.averageStayDuration || 0} nuits en moyenne
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(occupancy?.occupancyRate || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {occupancy?.occupiedDays || 0} / {occupancy?.totalDays || 0} jours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenu moyen</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(revenue?.averageRevenuePerBooking || 0)}
                </div>
                <p className="text-xs text-muted-foreground">par réservation</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="revenue">Revenus</TabsTrigger>
              <TabsTrigger value="occupancy">Occupation</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="properties">Propriétés</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des revenus</CardTitle>
                  <CardDescription>
                    Revenus mensuels sur la période sélectionnée
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenue?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${value}€`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        name="Revenus"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="occupancy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Taux d'occupation</CardTitle>
                  <CardDescription>
                    Évolution mensuelle du taux d'occupation
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancy?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => formatPercent(Number(value))} />
                      <Legend />
                      <Bar
                        dataKey="occupancyRate"
                        fill="#82ca9d"
                        name="Taux d'occupation"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sources de réservations</CardTitle>
                  <CardDescription>
                    Répartition des réservations par source
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview?.bookingSources || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.source} (${entry.count})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(overview?.bookingSources || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top propriétés</CardTitle>
                  <CardDescription>
                    Les propriétés les plus performantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(overview?.topProperties || []).map((property, index) => (
                      <div key={property.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{property.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {property.bookings} réservations
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(property.revenue)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(property.revenue / (property.bookings || 1))} / réservation
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}