'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { Property } from '@/types/property';

interface PropertyContextType {
  property: Property | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: PropertyContextType;
}) {
  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
}