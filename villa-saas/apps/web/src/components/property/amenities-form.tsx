'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface AmenitiesFormProps {
  amenities: Record<string, boolean>;
  atmosphere: Record<string, number>;
  onAmenitiesChange: (amenities: Record<string, boolean>) => void;
  onAtmosphereChange: (atmosphere: Record<string, number>) => void;
}

const AMENITIES_LIST = [
  { key: 'wifi', label: 'WiFi', category: 'Connectivité' },
  { key: 'parking', label: 'Parking', category: 'Transport' },
  { key: 'airConditioning', label: 'Climatisation', category: 'Confort' },
  { key: 'heating', label: 'Chauffage', category: 'Confort' },
  { key: 'kitchen', label: 'Cuisine équipée', category: 'Équipements' },
  { key: 'washingMachine', label: 'Lave-linge', category: 'Équipements' },
  { key: 'dishwasher', label: 'Lave-vaisselle', category: 'Équipements' },
  { key: 'tv', label: 'Télévision', category: 'Divertissement' },
  { key: 'pool', label: 'Piscine', category: 'Extérieur' },
  { key: 'garden', label: 'Jardin', category: 'Extérieur' },
  { key: 'terrace', label: 'Terrasse', category: 'Extérieur' },
  { key: 'balcony', label: 'Balcon', category: 'Extérieur' },
  { key: 'bbq', label: 'Barbecue', category: 'Extérieur' },
  { key: 'fireplace', label: 'Cheminée', category: 'Confort' },
  { key: 'seaView', label: 'Vue mer', category: 'Vue' },
  { key: 'mountainView', label: 'Vue montagne', category: 'Vue' },
  { key: 'petFriendly', label: 'Animaux acceptés', category: 'Règles' },
  { key: 'smokingAllowed', label: 'Fumeurs acceptés', category: 'Règles' },
  { key: 'wheelchairAccessible', label: 'Accessible PMR', category: 'Accessibilité' },
  { key: 'elevator', label: 'Ascenseur', category: 'Accessibilité' },
  { key: 'gym', label: 'Salle de sport', category: 'Bien-être' },
  { key: 'spa', label: 'Spa', category: 'Bien-être' },
  { key: 'sauna', label: 'Sauna', category: 'Bien-être' },
  { key: 'jacuzzi', label: 'Jacuzzi', category: 'Bien-être' },
];

const ATMOSPHERE_LIST = [
  { key: 'romantic', label: 'Romantique', description: 'Idéal pour les couples' },
  { key: 'family', label: 'Familial', description: 'Adapté aux familles avec enfants' },
  { key: 'business', label: 'Affaires', description: 'Équipé pour le travail' },
  { key: 'party', label: 'Festif', description: 'Permet les événements' },
  { key: 'calm', label: 'Calme', description: 'Environnement paisible' },
  { key: 'luxury', label: 'Luxueux', description: 'Haut de gamme' },
  { key: 'rustic', label: 'Rustique', description: 'Charme traditionnel' },
  { key: 'modern', label: 'Moderne', description: 'Design contemporain' },
  { key: 'beachfront', label: 'Bord de mer', description: 'Accès direct à la plage' },
  { key: 'countryside', label: 'Campagne', description: 'En pleine nature' },
  { key: 'mountain', label: 'Montagne', description: 'En altitude' },
  { key: 'urban', label: 'Urbain', description: 'En centre-ville' },
];

export function AmenitiesForm({
  amenities,
  atmosphere,
  onAmenitiesChange,
  onAtmosphereChange,
}: AmenitiesFormProps) {
  // Grouper les équipements par catégorie
  const groupedAmenities = AMENITIES_LIST.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, typeof AMENITIES_LIST>);

  const handleAmenityChange = (key: string, checked: boolean) => {
    onAmenitiesChange({
      ...amenities,
      [key]: checked,
    });
  };

  const handleAtmosphereChange = (key: string, value: number[]) => {
    onAtmosphereChange({
      ...atmosphere,
      [key]: value[0] / 100, // Convertir de 0-100 à 0-1
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Équipements</CardTitle>
          <CardDescription>
            Sélectionnez les équipements disponibles dans votre propriété
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedAmenities).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map((amenity) => (
                    <div key={amenity.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.key}
                        checked={amenities[amenity.key] || false}
                        onCheckedChange={(checked) =>
                          handleAmenityChange(amenity.key, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={amenity.key}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {amenity.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atmosphère</CardTitle>
          <CardDescription>
            Définissez l'ambiance de votre propriété pour aider l'IA à mieux la recommander
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {ATMOSPHERE_LIST.map((item) => (
              <div key={item.key} className="space-y-2">
                <div className="flex justify-between">
                  <div>
                    <Label>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round((atmosphere[item.key] || 0) * 100)}%
                  </span>
                </div>
                <Slider
                  value={[(atmosphere[item.key] || 0) * 100]}
                  onValueChange={(value) => handleAtmosphereChange(item.key, value)}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}