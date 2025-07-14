'use client';

import { ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Settings, MapPin, Bed, Activity, Wrench } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProperty } from '@/contexts/property-context';

const contentTabs = [
  { value: 'settings', label: 'Paramètres', href: '/settings', icon: Settings },
  { value: 'location', label: 'Localisation', href: '/location', icon: MapPin },
  { value: 'rooms', label: 'Chambres', href: '/rooms', icon: Bed },
  { value: 'activities', label: 'Activités', href: '/activities', icon: Activity },
  { value: 'services', label: 'Services', href: '/services', icon: Wrench },
];

export default function ContentLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const { property } = useProperty();

  const getCurrentTab = () => {
    const basePath = `/admin/dashboard/properties/${params.id}/content`;
    if (pathname === basePath || pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/location')) return 'location';
    if (pathname.includes('/rooms')) return 'rooms';
    if (pathname.includes('/activities')) return 'activities';
    if (pathname.includes('/services')) return 'services';
    return 'settings';
  };

  // Filtrer les onglets pour n'afficher que "Paramètres" + les pages activées
  const getVisibleTabs = () => {
    const visibleTabs = [contentTabs[0]]; // Toujours afficher "Paramètres"
    
    if (property?.customPages?.location) {
      visibleTabs.push(contentTabs[1]);
    }
    if (property?.customPages?.rooms) {
      visibleTabs.push(contentTabs[2]);
    }
    if (property?.customPages?.activities) {
      visibleTabs.push(contentTabs[3]);
    }
    if (property?.customPages?.services) {
      visibleTabs.push(contentTabs[4]);
    }
    
    return visibleTabs;
  };

  const visibleTabs = getVisibleTabs();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Gestion du contenu</h2>
        <p className="text-muted-foreground mb-6">
          Gérez les pages personnalisées et leur contenu pour votre propriété.
        </p>
      </div>

      <Tabs value={getCurrentTab()} className="mb-6">
        <TabsList 
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${Math.min(visibleTabs.length, 5)}, minmax(0, 1fr))`
          }}
        >
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} asChild>
                <Link 
                  href={`/admin/dashboard/properties/${params.id}/content${tab.href}`}
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
}