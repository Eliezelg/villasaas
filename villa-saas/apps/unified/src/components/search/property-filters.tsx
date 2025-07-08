'use client'

import { useState } from 'react'
import { Filter, X, ChevronDown, Home, Euro, Bed, Users, Wifi, Car, Trees, Waves } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PropertyFiltersProps {
  onFiltersChange: (filters: FilterValues) => void
  isLoading?: boolean
}

export interface FilterValues {
  propertyType?: string[]
  priceRange?: { min?: number; max?: number }
  bedrooms?: number[]
  guests?: number
  amenities?: string[]
  atmosphere?: string[]
}

const propertyTypes = [
  { value: 'VILLA', label: 'Villa', icon: Home },
  { value: 'HOUSE', label: 'Maison', icon: Home },
  { value: 'APARTMENT', label: 'Appartement', icon: Home },
]

const amenityOptions = [
  { value: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { value: 'pool', label: 'Piscine', icon: Waves },
  { value: 'parking', label: 'Parking', icon: Car },
  { value: 'airConditioning', label: 'Climatisation' },
  { value: 'kitchen', label: 'Cuisine équipée' },
  { value: 'washingMachine', label: 'Lave-linge' },
  { value: 'dishwasher', label: 'Lave-vaisselle' },
  { value: 'tv', label: 'Télévision' },
  { value: 'heating', label: 'Chauffage' },
  { value: 'fireplace', label: 'Cheminée' },
  { value: 'bbq', label: 'Barbecue' },
  { value: 'garden', label: 'Jardin', icon: Trees },
  { value: 'terrace', label: 'Terrasse' },
  { value: 'balcony', label: 'Balcon' },
  { value: 'jacuzzi', label: 'Jacuzzi' },
  { value: 'gym', label: 'Salle de sport' },
  { value: 'petanque', label: 'Terrain de pétanque' },
]

const atmosphereOptions = [
  { value: 'familyFriendly', label: 'Familial' },
  { value: 'romantic', label: 'Romantique' },
  { value: 'businessReady', label: 'Business' },
  { value: 'partyFriendly', label: 'Festif' },
  { value: 'luxury', label: 'Luxe' },
  { value: 'rustic', label: 'Rustique' },
  { value: 'modern', label: 'Moderne' },
  { value: 'beachfront', label: 'Bord de mer' },
  { value: 'countryside', label: 'Campagne' },
  { value: 'cityCenter', label: 'Centre-ville' },
  { value: 'mountain', label: 'Montagne' },
  { value: 'peaceful', label: 'Calme' },
]

export function PropertyFilters({ onFiltersChange, isLoading }: PropertyFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  const updateFilter = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Compter les filtres actifs
    let count = 0
    if (newFilters.propertyType?.length) count++
    if (newFilters.priceRange?.min || newFilters.priceRange?.max) count++
    if (newFilters.bedrooms?.length) count++
    if (newFilters.guests && newFilters.guests > 1) count++
    if (newFilters.amenities?.length) count++
    if (newFilters.atmosphere?.length) count++
    
    setActiveFilterCount(count)
  }

  const toggleArrayFilter = (key: 'propertyType' | 'amenities' | 'atmosphere' | 'bedrooms', value: string | number) => {
    const currentValues = filters[key] || []
    const newValues = currentValues.includes(value as any)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value as any]
    
    updateFilter(key, newValues.length > 0 ? newValues : undefined)
  }

  const applyFilters = () => {
    onFiltersChange(filters)
    setIsOpen(false)
  }

  const resetFilters = () => {
    setFilters({})
    setActiveFilterCount(0)
    onFiltersChange({})
  }

  return (
    <>
      {/* Bouton pour ouvrir les filtres */}
      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsOpen(true)}
        className="relative"
        disabled={isLoading}
      >
        <Filter className="mr-2 h-4 w-4" />
        Filtres
        {activeFilterCount > 0 && (
          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Modal/Sidebar des filtres */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-lg sm:w-96"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Filtres</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Filtres */}
            <div className="space-y-6">
              {/* Type de propriété */}
              <div>
                <h3 className="mb-3 font-medium">Type de propriété</h3>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = filters.propertyType?.includes(type.value)
                    return (
                      <Button
                        key={type.value}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayFilter('propertyType', type.value)}
                        className="justify-start"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {type.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Fourchette de prix */}
              <div>
                <h3 className="mb-3 font-medium">Prix par nuit</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Min</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={filters.priceRange?.min || ''}
                        onChange={(e) => updateFilter('priceRange', {
                          ...filters.priceRange,
                          min: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="w-full rounded-md border px-3 py-2 pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Max</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        min="0"
                        placeholder="1000"
                        value={filters.priceRange?.max || ''}
                        onChange={(e) => updateFilter('priceRange', {
                          ...filters.priceRange,
                          max: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="w-full rounded-md border px-3 py-2 pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nombre de chambres */}
              <div>
                <h3 className="mb-3 font-medium">Chambres</h3>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isSelected = filters.bedrooms?.includes(num)
                    return (
                      <Button
                        key={num}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayFilter('bedrooms', num)}
                        className="h-10 w-10 p-0"
                      >
                        {num}+
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Équipements */}
              <div>
                <h3 className="mb-3 font-medium">Équipements</h3>
                <div className="grid grid-cols-2 gap-2">
                  {amenityOptions.slice(0, 8).map((amenity) => {
                    const Icon = amenity.icon
                    const isSelected = filters.amenities?.includes(amenity.value)
                    return (
                      <Button
                        key={amenity.value}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayFilter('amenities', amenity.value)}
                        className="justify-start text-sm"
                      >
                        {Icon && <Icon className="mr-1 h-3 w-3" />}
                        {amenity.label}
                      </Button>
                    )
                  })}
                </div>
                
                {/* Afficher plus d'équipements */}
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-primary hover:underline">
                    Plus d'équipements
                  </summary>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {amenityOptions.slice(8).map((amenity) => {
                      const isSelected = filters.amenities?.includes(amenity.value)
                      return (
                        <Button
                          key={amenity.value}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleArrayFilter('amenities', amenity.value)}
                          className="justify-start text-sm"
                        >
                          {amenity.label}
                        </Button>
                      )
                    })}
                  </div>
                </details>
              </div>

              {/* Ambiance */}
              <div>
                <h3 className="mb-3 font-medium">Ambiance</h3>
                <div className="grid grid-cols-2 gap-2">
                  {atmosphereOptions.map((atmosphere) => {
                    const isSelected = filters.atmosphere?.includes(atmosphere.value)
                    return (
                      <Button
                        key={atmosphere.value}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArrayFilter('atmosphere', atmosphere.value)}
                        className="justify-start text-sm"
                      >
                        {atmosphere.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex-1"
              >
                Réinitialiser
              </Button>
              <Button
                onClick={applyFilters}
                className="flex-1"
              >
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}