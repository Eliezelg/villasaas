'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { propertiesService } from '@/services/properties.service';
import { PropertyProvider } from '@/contexts/property-context';
import type { Property } from '@/types/property';

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: 'Appartement',
  HOUSE: 'Maison',
  VILLA: 'Villa',
  STUDIO: 'Studio',
  LOFT: 'Loft',
  CHALET: 'Chalet',
  BUNGALOW: 'Bungalow',
  MOBILE_HOME: 'Mobil-home',
  BOAT: 'Bateau',
  OTHER: 'Autre',
};

const statusLabels = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' as const },
  PUBLISHED: { label: 'Publié', variant: 'success' as const },
  ARCHIVED: { label: 'Archivé', variant: 'destructive' as const },
};

const tabs = [
  { value: 'general', label: 'Général', href: '/general' },
  { value: 'details', label: 'Détails', href: '/details' },
  { value: 'location', label: 'Localisation', href: '/location' },
  { value: 'pricing', label: 'Tarification', href: '/pricing' },
  { value: 'availability', label: 'Disponibilités', href: '/availability' },
  { value: 'content', label: 'Contenu', href: '/content' },
  { value: 'options', label: 'Options', href: '/options' },
  { value: 'languages', label: 'Langues', href: '/languages' },
  { value: 'domain', label: 'Domaine', href: '/domain' },
];

export default function PropertyLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [property, setProperty] = useState<Property | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProperty = useCallback(async () => {
    if (!params.id) return;
    
    setIsLoading(true);
    const { data } = await propertiesService.getById(params.id as string);
    if (data) {
      setProperty(data);
    }
    setIsLoading(false);
  }, [params.id]);

  const loadAllProperties = useCallback(async () => {
    const { data } = await propertiesService.getAll();
    if (data) {
      setAllProperties(data);
    }
  }, []);

  useEffect(() => {
    loadProperty();
    loadAllProperties();
  }, [loadProperty, loadAllProperties]);

  const handlePropertyChange = (propertyId: string) => {
    const currentPath = pathname.split(`/properties/${params.id}`)[1] || '/general';
    router.push(`/${locale}/admin/dashboard/properties/${propertyId}${currentPath}`);
  };

  const getCurrentTab = () => {
    const basePath = `/${locale}/admin/dashboard/properties/${params.id}`;
    if (pathname === `${basePath}/general` || pathname === basePath) return 'general';
    if (pathname.includes('/details')) return 'details';
    if (pathname.includes('/location')) return 'location';
    if (pathname.includes('/pricing')) return 'pricing';
    if (pathname.includes('/availability')) return 'availability';
    if (pathname.includes('/options')) return 'options';
    if (pathname.includes('/content')) return 'content';
    if (pathname.includes('/languages')) return 'languages';
    if (pathname.includes('/domain')) return 'domain';
    return 'general';
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Propriété non trouvée
        </div>
        <Button asChild className="mt-4">
          <Link href={`/${locale}/admin/dashboard/properties`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux propriétés
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <PropertyProvider value={{ property, isLoading, reload: loadProperty }}>
      <div className="container max-w-6xl py-8">
        {/* Sélecteur de propriété si plusieurs propriétés */}
        {allProperties.length > 1 && (
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Propriété actuelle :</span>
              <Select value={params.id as string} onValueChange={handlePropertyChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allProperties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.name} - {prop.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/admin/dashboard/properties`}>
                Voir toutes les propriétés
              </Link>
            </Button>
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {allProperties.length <= 1 && (
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/${locale}/admin/dashboard/properties`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold">{property.name}</h1>
              <p className="text-muted-foreground">
                {propertyTypeLabels[property.propertyType]} • {property.city}
              </p>
            </div>
          </div>
          <Badge variant={statusLabels[property.status].variant}>
            {statusLabels[property.status].label}
          </Badge>
        </div>

        <Tabs value={getCurrentTab()} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} asChild>
                <Link 
                  href={`/${locale}/admin/dashboard/properties/${params.id}${tab.href}`}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {children}
      </div>
    </PropertyProvider>
  );
}