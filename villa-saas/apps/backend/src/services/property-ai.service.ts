import { Property } from '@prisma/client';
import OpenAI from 'openai';

export class PropertyAIService {
  /**
   * Génère le contenu searchable à partir des données de la propriété
   */
  static generateSearchableContent(property: Partial<Property>): string {
    const parts: string[] = [];

    // Informations de base
    if (property.name) parts.push(property.name);
    if (property.propertyType) parts.push(property.propertyType.toLowerCase());
    
    // Localisation
    if (property.city) parts.push(property.city);
    if (property.country) parts.push(property.country);
    
    // Capacité
    if (property.bedrooms) parts.push(`${property.bedrooms} chambres`);
    if (property.bathrooms) parts.push(`${property.bathrooms} salles de bain`);
    if (property.maxGuests) parts.push(`${property.maxGuests} personnes`);
    if (property.surfaceArea) parts.push(`${property.surfaceArea}m²`);
    
    // Description (toutes les langues)
    if (property.description && typeof property.description === 'object') {
      const desc = property.description as Record<string, string>;
      Object.values(desc).forEach(text => {
        if (text) parts.push(text);
      });
    }
    
    // Équipements
    if (property.amenities && typeof property.amenities === 'object') {
      const amenities = property.amenities as Record<string, boolean>;
      Object.entries(amenities).forEach(([key, value]) => {
        if (value) {
          parts.push(this.translateAmenity(key));
        }
      });
    }
    
    // Atmosphères
    if (property.atmosphere && typeof property.atmosphere === 'object') {
      const atmosphere = property.atmosphere as Record<string, number>;
      Object.entries(atmosphere).forEach(([key, score]) => {
        if (score > 0.7) {
          parts.push(this.translateAtmosphere(key));
        }
      });
    }
    
    // Proximités
    if (property.proximity && typeof property.proximity === 'object') {
      const proximity = property.proximity as Record<string, number>;
      Object.entries(proximity).forEach(([key, distance]) => {
        if (distance < 1000) {
          parts.push(`proche ${this.translateProximity(key)}`);
        }
      });
    }

    return parts.join(' ').toLowerCase();
  }

  /**
   * Prépare les données pour la génération d'embeddings
   */
  static prepareEmbeddingContent(property: Partial<Property>): string {
    const parts: string[] = [];

    // Titre et type
    if (property.name) parts.push(property.name);
    if (property.propertyType) {
      parts.push(`Type: ${this.translatePropertyType(property.propertyType)}`);
    }

    // Localisation
    if (property.city && property.country) {
      parts.push(`Localisation: ${property.city}, ${property.country}`);
    }

    // Capacité
    const capacity: string[] = [];
    if (property.bedrooms) capacity.push(`${property.bedrooms} chambres`);
    if (property.bathrooms) capacity.push(`${property.bathrooms} salles de bain`);
    if (property.maxGuests) capacity.push(`${property.maxGuests} personnes maximum`);
    if (capacity.length > 0) {
      parts.push(`Capacité: ${capacity.join(', ')}`);
    }

    // Description principale (français)
    if (property.description && typeof property.description === 'object') {
      const desc = property.description as Record<string, string>;
      if (desc.fr) {
        parts.push(`Description: ${desc.fr}`);
      }
    }

    // Équipements principaux
    if (property.amenities && typeof property.amenities === 'object') {
      const amenities = property.amenities as Record<string, boolean>;
      const activeAmenities = Object.entries(amenities)
        .filter(([_, value]) => value)
        .map(([key]) => this.translateAmenity(key));
      
      if (activeAmenities.length > 0) {
        parts.push(`Équipements: ${activeAmenities.join(', ')}`);
      }
    }

    // Atmosphères dominantes
    if (property.atmosphere && typeof property.atmosphere === 'object') {
      const atmosphere = property.atmosphere as Record<string, number>;
      const dominantAtmospheres = Object.entries(atmosphere)
        .filter(([_, score]) => score > 0.7)
        .sort(([, a], [, b]) => b - a)
        .map(([key]) => this.translateAtmosphere(key));
      
      if (dominantAtmospheres.length > 0) {
        parts.push(`Ambiance: ${dominantAtmospheres.join(', ')}`);
      }
    }

    return parts.join('. ');
  }

  /**
   * Génère un embedding vectoriel avec OpenAI
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    // Vérifier que la clé API est configurée
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY non configurée - embedding désactivé');
      return [];
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      const embedding = response.data[0]?.embedding;
      return embedding || [];
    } catch (error) {
      console.error('❌ Erreur génération embedding:', error);
      // Retourner un vecteur vide en cas d'erreur pour ne pas bloquer
      return [];
    }
  }

  // Traductions des clés
  private static translatePropertyType(type: string): string {
    const translations: Record<string, string> = {
      APARTMENT: 'Appartement',
      HOUSE: 'Maison',
      VILLA: 'Villa',
      STUDIO: 'Studio',
      LOFT: 'Loft',
      CHALET: 'Chalet',
      BUNGALOW: 'Bungalow',
      MOBILE_HOME: 'Mobil-home',
      BOAT: 'Bateau',
      OTHER: 'Autre'
    };
    return translations[type] || type;
  }

  private static translateAmenity(amenity: string): string {
    const translations: Record<string, string> = {
      wifi: 'WiFi',
      pool: 'Piscine',
      parking: 'Parking',
      airConditioning: 'Climatisation',
      heating: 'Chauffage',
      kitchen: 'Cuisine équipée',
      washingMachine: 'Lave-linge',
      dishwasher: 'Lave-vaisselle',
      tv: 'Télévision',
      fireplace: 'Cheminée',
      bbq: 'Barbecue',
      garden: 'Jardin',
      terrace: 'Terrasse',
      balcony: 'Balcon',
      seaView: 'Vue mer',
      mountainView: 'Vue montagne',
      petFriendly: 'Animaux acceptés',
      smokingAllowed: 'Fumeurs acceptés',
      wheelchairAccessible: 'Accessible PMR',
      elevator: 'Ascenseur',
      gym: 'Salle de sport',
      spa: 'Spa',
      sauna: 'Sauna',
      jacuzzi: 'Jacuzzi'
    };
    return translations[amenity] || amenity;
  }

  private static translateAtmosphere(atmosphere: string): string {
    const translations: Record<string, string> = {
      romantic: 'Romantique',
      family: 'Familial',
      business: 'Affaires',
      party: 'Festif',
      calm: 'Calme',
      luxury: 'Luxueux',
      rustic: 'Rustique',
      modern: 'Moderne',
      beachfront: 'Bord de mer',
      countryside: 'Campagne',
      mountain: 'Montagne',
      urban: 'Urbain'
    };
    return translations[atmosphere] || atmosphere;
  }

  private static translateProximity(proximity: string): string {
    const translations: Record<string, string> = {
      beach: 'plage',
      shops: 'commerces',
      restaurants: 'restaurants',
      publicTransport: 'transports en commun',
      airport: 'aéroport',
      trainStation: 'gare',
      hospital: 'hôpital',
      pharmacy: 'pharmacie',
      supermarket: 'supermarché',
      cityCenter: 'centre-ville',
      skiSlopes: 'pistes de ski',
      golfCourse: 'golf',
      marina: 'port de plaisance',
      hiking: 'randonnées'
    };
    return translations[proximity] || proximity;
  }
}