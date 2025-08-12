import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import axios from 'axios';

const geocodeSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional(),
  country: z.string().default('FR'),
});

export async function geocodingRoutes(fastify: FastifyInstance) {
  // Route pour géocoder une adresse
  fastify.post('/geocode', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Géocoder une adresse',
      tags: ['geocoding'],
    }
  }, async (request, reply) => {
    const validation = geocodeSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { address, city, postalCode, country } = validation.data;

    try {
      // Construire la requête
      const query = postalCode 
        ? `${address}, ${postalCode} ${city}, ${country}`
        : `${address}, ${city}, ${country}`;

      // Appeler Nominatim avec un User-Agent approprié
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          format: 'json',
          q: query,
          limit: 1,
          'accept-language': 'fr',
        },
        headers: {
          'User-Agent': 'VillaSaaS/1.0 (contact@villasaas.com)',
        },
        timeout: 5000,
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          success: true,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          display_name: result.display_name,
          place_id: result.place_id,
        };
      }

      // Si pas de résultat avec l'adresse complète, essayer avec juste la ville
      const fallbackResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          format: 'json',
          q: `${city}, ${country}`,
          limit: 1,
          'accept-language': 'fr',
        },
        headers: {
          'User-Agent': 'VillaSaaS/1.0 (contact@villasaas.com)',
        },
        timeout: 5000,
      });

      if (fallbackResponse.data && fallbackResponse.data.length > 0) {
        const result = fallbackResponse.data[0];
        return {
          success: true,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          display_name: result.display_name,
          place_id: result.place_id,
          fallback: true,
        };
      }

      return {
        success: false,
        error: 'Aucune coordonnée trouvée pour cette adresse',
      };
    } catch (error) {
      fastify.log.error('Geocoding error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erreur lors de la géolocalisation',
      });
    }
  });

  // Route pour faire une géolocalisation inverse
  fastify.post('/reverse-geocode', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Géolocalisation inverse',
      tags: ['geocoding'],
    }
  }, async (request, reply) => {
    const schema = z.object({
      latitude: z.number(),
      longitude: z.number(),
    });

    const validation = schema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { latitude, longitude } = validation.data;

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          format: 'json',
          lat: latitude,
          lon: longitude,
          'accept-language': 'fr',
        },
        headers: {
          'User-Agent': 'VillaSaaS/1.0 (contact@villasaas.com)',
        },
        timeout: 5000,
      });

      if (response.data) {
        const { address } = response.data;
        return {
          success: true,
          address: address.road || address.pedestrian || '',
          city: address.city || address.town || address.village || '',
          postalCode: address.postcode || '',
          country: address.country || '',
          display_name: response.data.display_name,
        };
      }

      return {
        success: false,
        error: 'Aucune adresse trouvée pour ces coordonnées',
      };
    } catch (error) {
      fastify.log.error('Reverse geocoding error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erreur lors de la géolocalisation inverse',
      });
    }
  });
}