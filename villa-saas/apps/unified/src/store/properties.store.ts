import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Property {
  id: string
  name: string
  propertyType: string
  status: string
  address: string
  city: string
  postalCode: string
  country: string
  latitude?: number
  longitude?: number
  bedrooms: number
  bathrooms: number
  maxGuests: number
  surfaceArea?: number
  description: Record<string, string>
  basePrice: number
  weekendPremium?: number
  cleaningFee?: number
  securityDeposit?: number
  minNights: number
  checkInTime: string
  checkOutTime: string
  instantBooking: boolean
  slug?: string
  images?: any[]
  amenities?: Record<string, any>
  features?: Record<string, any>
  atmosphere?: Record<string, any>
  proximity?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface PropertiesState {
  properties: Property[]
  selectedProperty: Property | null
  isLoading: boolean
  error: string | null
  setProperties: (properties: Property[]) => void
  setSelectedProperty: (property: Property | null) => void
  addProperty: (property: Property) => void
  updateProperty: (id: string, updates: Partial<Property>) => void
  removeProperty: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearStore: () => void
}

export const usePropertiesStore = create<PropertiesState>()(
  persist(
    (set) => ({
      properties: [],
      selectedProperty: null,
      isLoading: false,
      error: null,

      setProperties: (properties) => set({ properties }),

      setSelectedProperty: (property) => set({ selectedProperty: property }),

      addProperty: (property) => 
        set((state) => ({ 
          properties: [...state.properties, property] 
        })),

      updateProperty: (id, updates) => 
        set((state) => ({
          properties: state.properties.map((p) => 
            p.id === id ? { ...p, ...updates } : p
          ),
          selectedProperty: state.selectedProperty?.id === id 
            ? { ...state.selectedProperty, ...updates }
            : state.selectedProperty
        })),

      removeProperty: (id) => 
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
          selectedProperty: state.selectedProperty?.id === id 
            ? null 
            : state.selectedProperty
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearStore: () => set({
        properties: [],
        selectedProperty: null,
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'properties-storage',
      partialize: (state) => ({ 
        properties: state.properties,
        selectedProperty: state.selectedProperty 
      }),
    }
  )
)