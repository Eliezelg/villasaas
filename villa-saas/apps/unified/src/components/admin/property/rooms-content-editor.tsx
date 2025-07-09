'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Bed } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface Bed {
  type: string // single, double, queen, king, sofa
  quantity: number
}

interface Room {
  name: {
    fr: string
    en: string
  }
  description: {
    fr: string
    en: string
  }
  beds: Bed[]
  maxOccupancy: number
  size?: number // en m²
  amenities: string[]
  privateAmenities?: {
    bathroom?: boolean
    toilet?: boolean
    balcony?: boolean
    terrace?: boolean
    kitchenette?: boolean
  }
}

interface RoomsContentEditorProps {
  propertyId: string
  initialContent?: Room[]
}

const bedTypes = [
  { value: 'single', label: 'Lit simple' },
  { value: 'double', label: 'Lit double' },
  { value: 'queen', label: 'Lit Queen' },
  { value: 'king', label: 'Lit King' },
  { value: 'sofa', label: 'Canapé-lit' },
  { value: 'bunk', label: 'Lits superposés' },
]

const roomAmenities = [
  { value: 'air_conditioning', label: 'Climatisation' },
  { value: 'heating', label: 'Chauffage' },
  { value: 'tv', label: 'Télévision' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'desk', label: 'Bureau' },
  { value: 'wardrobe', label: 'Armoire' },
  { value: 'safe', label: 'Coffre-fort' },
  { value: 'minibar', label: 'Minibar' },
  { value: 'coffee_machine', label: 'Machine à café' },
  { value: 'hairdryer', label: 'Sèche-cheveux' },
]

export function RoomsContentEditor({ propertyId, initialContent }: RoomsContentEditorProps) {
  const [rooms, setRooms] = useState<Room[]>(initialContent || [])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        name: { fr: '', en: '' },
        description: { fr: '', en: '' },
        beds: [{ type: 'double', quantity: 1 }],
        maxOccupancy: 2,
        amenities: [],
        privateAmenities: {}
      }
    ])
  }

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index))
  }

  const updateRoom = (index: number, field: keyof Room, value: any) => {
    const updatedRooms = [...rooms]
    updatedRooms[index] = {
      ...updatedRooms[index],
      [field]: value
    }
    setRooms(updatedRooms)
  }

  const updateRoomTranslation = (
    index: number, 
    field: 'name' | 'description', 
    lang: 'fr' | 'en', 
    value: string
  ) => {
    const updatedRooms = [...rooms]
    updatedRooms[index] = {
      ...updatedRooms[index],
      [field]: {
        ...updatedRooms[index][field],
        [lang]: value
      }
    }
    setRooms(updatedRooms)
  }

  const addBedToRoom = (roomIndex: number) => {
    const updatedRooms = [...rooms]
    updatedRooms[roomIndex].beds.push({ type: 'single', quantity: 1 })
    setRooms(updatedRooms)
  }

  const updateBed = (roomIndex: number, bedIndex: number, field: keyof Bed, value: any) => {
    const updatedRooms = [...rooms]
    updatedRooms[roomIndex].beds[bedIndex] = {
      ...updatedRooms[roomIndex].beds[bedIndex],
      [field]: value
    }
    setRooms(updatedRooms)
  }

  const removeBed = (roomIndex: number, bedIndex: number) => {
    const updatedRooms = [...rooms]
    updatedRooms[roomIndex].beds = updatedRooms[roomIndex].beds.filter((_, i) => i !== bedIndex)
    setRooms(updatedRooms)
  }

  const toggleAmenity = (roomIndex: number, amenity: string) => {
    const updatedRooms = [...rooms]
    const amenities = updatedRooms[roomIndex].amenities
    const index = amenities.indexOf(amenity)
    
    if (index > -1) {
      amenities.splice(index, 1)
    } else {
      amenities.push(amenity)
    }
    
    setRooms(updatedRooms)
  }

  const togglePrivateAmenity = (roomIndex: number, amenity: string, value: boolean) => {
    const updatedRooms = [...rooms]
    updatedRooms[roomIndex].privateAmenities = {
      ...updatedRooms[roomIndex].privateAmenities,
      [amenity]: value
    }
    setRooms(updatedRooms)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await apiClient.patch(`/api/properties/${propertyId}`, {
        roomsContent: rooms
      })
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to save rooms content')
      }

      toast({
        title: 'Contenu sauvegardé',
        description: 'Les informations des chambres ont été mises à jour',
      })
    } catch (error) {
      console.error('Error saving rooms content:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le contenu',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contenu de la page Chambres</CardTitle>
          <CardDescription>
            Gérez les informations détaillées de chaque chambre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Chambres</h3>
            <Button onClick={addRoom} size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une chambre
            </Button>
          </div>

          {rooms.map((room, roomIndex) => (
            <Card key={roomIndex}>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Chambre #{roomIndex + 1}</span>
                    </div>
                    <Button
                      onClick={() => removeRoom(roomIndex)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Nom de la chambre */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom (Français)</Label>
                      <Input
                        value={room.name.fr}
                        onChange={(e) => updateRoomTranslation(roomIndex, 'name', 'fr', e.target.value)}
                        placeholder="Ex: Chambre principale"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom (English)</Label>
                      <Input
                        value={room.name.en}
                        onChange={(e) => updateRoomTranslation(roomIndex, 'name', 'en', e.target.value)}
                        placeholder="Ex: Master bedroom"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Description (Français)</Label>
                      <Textarea
                        value={room.description.fr}
                        onChange={(e) => updateRoomTranslation(roomIndex, 'description', 'fr', e.target.value)}
                        placeholder="Description de la chambre..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (English)</Label>
                      <Textarea
                        value={room.description.en}
                        onChange={(e) => updateRoomTranslation(roomIndex, 'description', 'en', e.target.value)}
                        placeholder="Room description..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Caractéristiques */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capacité maximale</Label>
                      <Input
                        type="number"
                        value={room.maxOccupancy}
                        onChange={(e) => updateRoom(roomIndex, 'maxOccupancy', parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Surface (m²)</Label>
                      <Input
                        type="number"
                        value={room.size || ''}
                        onChange={(e) => updateRoom(roomIndex, 'size', parseInt(e.target.value) || 0)}
                        placeholder="20"
                      />
                    </div>
                  </div>

                  {/* Lits */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Lits</Label>
                      <Button
                        onClick={() => addBedToRoom(roomIndex)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Ajouter un lit
                      </Button>
                    </div>
                    
                    {room.beds.map((bed, bedIndex) => (
                      <div key={bedIndex} className="flex items-end gap-4">
                        <div className="flex-1">
                          <Label>Type de lit</Label>
                          <Select
                            value={bed.type}
                            onValueChange={(value) => updateBed(roomIndex, bedIndex, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {bedTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Label>Quantité</Label>
                          <Input
                            type="number"
                            value={bed.quantity}
                            onChange={(e) => updateBed(roomIndex, bedIndex, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                        </div>
                        <Button
                          onClick={() => removeBed(roomIndex, bedIndex)}
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Équipements */}
                  <div className="space-y-4">
                    <Label>Équipements de la chambre</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {roomAmenities.map((amenity) => (
                        <div key={amenity.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${roomIndex}-${amenity.value}`}
                            checked={room.amenities.includes(amenity.value)}
                            onCheckedChange={() => toggleAmenity(roomIndex, amenity.value)}
                          />
                          <Label
                            htmlFor={`${roomIndex}-${amenity.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {amenity.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Équipements privés */}
                  <div className="space-y-4">
                    <Label>Équipements privés</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { value: 'bathroom', label: 'Salle de bain privée' },
                        { value: 'toilet', label: 'WC privé' },
                        { value: 'balcony', label: 'Balcon' },
                        { value: 'terrace', label: 'Terrasse' },
                        { value: 'kitchenette', label: 'Kitchenette' },
                      ].map((amenity) => (
                        <div key={amenity.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${roomIndex}-private-${amenity.value}`}
                            checked={room.privateAmenities?.[amenity.value as keyof typeof room.privateAmenities] || false}
                            onCheckedChange={(checked) => 
                              togglePrivateAmenity(roomIndex, amenity.value, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`${roomIndex}-private-${amenity.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {amenity.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}