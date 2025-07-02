'use client';

import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface LocationFormProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  onLocationChange: (data: {
    latitude?: number;
    longitude?: number;
    address?: string;
  }) => void;
}

export function LocationForm({
  latitude,
  longitude,
  address,
  city,
  postalCode,
  country,
  onLocationChange,
}: LocationFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleAddressSearch = async () => {
    // Utiliser l'adresse complète si aucune recherche n'est spécifiée
    const query = searchQuery.trim() || address;
    if (!query) {
      alert('Veuillez saisir une adresse à rechercher');
      return;
    }

    setIsSearching(true);
    try {
      // Construire une requête de recherche complète
      const fullQuery = [query, city, postalCode, country || 'France']
        .filter(Boolean)
        .join(', ');

      console.log('Recherche de:', fullQuery);

      // Recherche avec Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          fullQuery
        )}&limit=5&accept-language=fr&countrycodes=fr,be,ch,lu,mc`
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const results = await response.json();
      console.log('Résultats:', results);

      if (results && results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        onLocationChange({
          latitude: lat,
          longitude: lon,
          address: result.display_name,
        });
        
        // Réinitialiser la recherche après succès
        setSearchQuery('');
      } else {
        // Essayer une recherche plus simple si aucun résultat
        const simpleQuery = `${city}, ${country || 'France'}`;
        console.log('Recherche simplifiée:', simpleQuery);
        
        const simpleResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            simpleQuery
          )}&limit=1&accept-language=fr`
        );
        
        const simpleResults = await simpleResponse.json();
        
        if (simpleResults && simpleResults.length > 0) {
          const result = simpleResults[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);

          onLocationChange({
            latitude: lat,
            longitude: lon,
            address: result.display_name,
          });
          
          alert('Coordonnées approximatives trouvées pour la ville. Vous pouvez les ajuster manuellement si nécessaire.');
        } else {
          alert('Adresse non trouvée. Essayez une recherche plus précise ou saisissez les coordonnées manuellement.');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Erreur lors de la recherche d\'adresse. Veuillez réessayer.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualCoordinates = () => {
    const lat = prompt('Latitude:', latitude?.toString() || '');
    const lon = prompt('Longitude:', longitude?.toString() || '');

    if (lat && lon) {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);

      if (!isNaN(latNum) && !isNaN(lonNum)) {
        onLocationChange({
          latitude: latNum,
          longitude: lonNum,
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Géolocalisation</CardTitle>
        <CardDescription>
          Recherchez l'adresse pour obtenir automatiquement les coordonnées GPS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Rechercher les coordonnées GPS</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Laissez vide pour utiliser l'adresse ci-dessus"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddressSearch();
                }
              }}
            />
            <Button
              onClick={handleAddressSearch}
              disabled={isSearching}
              variant="outline"
            >
              {isSearching ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {address || city ? (
              <>Adresse actuelle: {address ? `${address}, ` : ''}{city} {postalCode}</>
            ) : (
              'Saisissez d\'abord l\'adresse dans le formulaire principal'
            )}
          </p>
        </div>

        {latitude && longitude && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Coordonnées GPS</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Latitude:</span>
                <p className="font-mono">{latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Longitude:</span>
                <p className="font-mono">{longitude.toFixed(6)}</p>
              </div>
            </div>
            
            <div className="pt-2">
              <a
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Voir sur OpenStreetMap →
              </a>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualCoordinates}
          >
            Saisir manuellement les coordonnées
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}