'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onLocationChange: (data: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
  readOnly?: boolean;
}

export function LocationMap({
  latitude,
  longitude,
  address,
  onLocationChange,
  readOnly = false,
}: LocationMapProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchAddress, setSearchAddress] = useState(address || '');
  const [isSearching, setIsSearching] = useState(false);
  const [map, setMap] = useState<any>(null);

  // Initialiser la carte
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Importer Leaflet dynamiquement côté client
    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Fixer les icônes Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });

      const mapInstance = L.map(mapRef.current).setView(
        [latitude || 46.603354, longitude || 1.888334], // Centre de la France par défaut
        latitude && longitude ? 13 : 6
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstance);

      // Ajouter un marqueur si on a des coordonnées
      if (latitude && longitude) {
        const marker = L.marker([latitude, longitude], {
          draggable: !readOnly,
        }).addTo(mapInstance);

        if (!readOnly) {
          marker.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            onLocationChange({ latitude: lat, longitude: lng });
          });
        }

        markerRef.current = marker;
      }

      // Gérer les clics sur la carte
      if (!readOnly) {
        mapInstance.on('click', (e: any) => {
          const { lat, lng } = e.latlng;

          // Supprimer l'ancien marqueur
          if (markerRef.current) {
            mapInstance.removeLayer(markerRef.current);
          }

          // Ajouter un nouveau marqueur
          const marker = L.marker([lat, lng], {
            draggable: true,
          }).addTo(mapInstance);

          marker.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            onLocationChange({ latitude: lat, longitude: lng });
          });

          markerRef.current = marker;
          onLocationChange({ latitude: lat, longitude: lng });
        });
      }

      setMap(mapInstance);
    };

    initMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recherche d'adresse (utilise Nominatim d'OpenStreetMap)
  const handleAddressSearch = async () => {
    if (!searchAddress.trim() || !map) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchAddress
        )}&limit=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        // Centrer la carte
        map.setView([lat, lon], 16);

        // Mettre à jour le marqueur
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        const L = await import('leaflet');
        const marker = L.marker([lat, lon], {
          draggable: !readOnly,
        }).addTo(map);

        if (!readOnly) {
          marker.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            onLocationChange({ latitude: lat, longitude: lng });
          });
        }

        markerRef.current = marker;
        onLocationChange({
          latitude: lat,
          longitude: lon,
          address: result.display_name,
        });
      } else {
        // Aucun résultat trouvé
        alert('Adresse non trouvée. Essayez une recherche plus précise.');
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Erreur lors de la recherche d\'adresse');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Localisation</CardTitle>
        <CardDescription>
          {readOnly
            ? 'Emplacement de la propriété'
            : 'Cliquez sur la carte ou recherchez une adresse pour définir l\'emplacement'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <div className="space-y-2">
            <Label>Rechercher une adresse</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 10 rue de la Paix, Paris"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
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
          </div>
        )}

        <div className="relative">
          <div
            ref={mapRef}
            className="h-[400px] w-full rounded-lg border"
          />
          {latitude && longitude && (
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur rounded px-2 py-1 text-xs">
              <MapPin className="inline h-3 w-3 mr-1" />
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}