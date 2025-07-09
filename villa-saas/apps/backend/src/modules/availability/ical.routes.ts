import { FastifyInstance } from 'fastify';
import { getTenantId } from '@villa-saas/utils';
import ical from 'ical-generator';
import * as icalParser from 'ical';

export default async function icalRoutes(fastify: FastifyInstance) {
  // Exporter le calendrier iCal
  fastify.get<{
    Params: { propertyId: string }
  }>(
    '/export/:propertyId',
    {
      schema: {
        description: 'Exporter le calendrier de disponibilité au format iCal',
        tags: ['availability'],
        params: {
          type: 'object',
          properties: {
            propertyId: { type: 'string' }
          },
          required: ['propertyId']
        }
      }
    },
    async (request, reply) => {
      const { propertyId } = request.params;
      
      // Pas d'authentification requise pour l'export iCal (URL publique)
      // mais on vérifie quand même que la propriété existe
      const property = await fastify.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          tenant: true
        }
      });

      if (!property || property.status !== 'PUBLISHED') {
        return reply.code(404).send({ error: 'Property not found' });
      }

      // Créer le calendrier iCal
      const calendar = ical({
        name: property.name,
        description: `Calendrier de disponibilité pour ${property.name}`,
        timezone: 'Europe/Paris',
        prodId: {
          company: 'Villa SaaS',
          product: 'Property Calendar',
          language: 'FR'
        }
      });

      // Récupérer toutes les réservations confirmées
      const bookings = await fastify.prisma.booking.findMany({
        where: {
          propertyId,
          status: { in: ['CONFIRMED', 'PENDING'] }
        },
        orderBy: { checkIn: 'asc' }
      });

      // Ajouter les réservations au calendrier
      for (const booking of bookings) {
        const event = calendar.createEvent({
          start: booking.checkIn,
          end: booking.checkOut,
          summary: `Réservation ${booking.reference}`,
          description: `${booking.guestFirstName} ${booking.guestLastName} - ${booking.adults + booking.children} personnes`,
          location: `${property.address}, ${property.city}`
        });
        event.uid(booking.id);
      }

      // Récupérer les périodes bloquées
      const blockedPeriods = await fastify.prisma.blockedPeriod.findMany({
        where: { propertyId },
        orderBy: { startDate: 'asc' }
      });

      // Ajouter les périodes bloquées
      for (const blocked of blockedPeriods) {
        const event = calendar.createEvent({
          start: blocked.startDate,
          end: blocked.endDate,
          summary: blocked.reason || 'Indisponible',
          description: blocked.notes || ''
        });
        event.uid(`blocked-${blocked.id}`);
      }

      // Retourner le calendrier
      reply.header('Content-Type', 'text/calendar; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="${property.slug}-calendar.ics"`);
      return calendar.toString();
    }
  );

  // Importer un calendrier iCal
  fastify.post<{
    Body: {
      propertyId: string;
      url?: string;
      content?: string;
    }
  }>(
    '/import',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Importer un calendrier iCal externe',
        tags: ['availability']
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { propertyId, url, content } = request.body;

      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId
        }
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      let icalContent: string;

      // Récupérer le contenu iCal
      if (url) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          icalContent = await response.text();
        } catch (error) {
          return reply.code(400).send({ 
            error: 'Failed to fetch iCal from URL',
            details: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      } else {
        icalContent = content!;
      }

      // Parser le contenu iCal
      let events;
      try {
        events = icalParser.parseICS(icalContent);
      } catch (error) {
        return reply.code(400).send({ 
          error: 'Invalid iCal format',
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Traiter chaque événement
      for (const [uid, event] of Object.entries(events)) {
        if (!event || (event as any).type !== 'VEVENT') continue;

        try {
          const startDate = new Date((event as any).start);
          const endDate = new Date((event as any).end);

          // Vérifier si c'est une date valide
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            errors.push(`Invalid dates for event ${uid}`);
            skipped++;
            continue;
          }

          // Vérifier si c'est dans le futur
          if (endDate < new Date()) {
            skipped++;
            continue;
          }

          // Vérifier s'il y a déjà une réservation sur cette période
          const existingBooking = await fastify.prisma.booking.findFirst({
            where: {
              propertyId,
              tenantId,
              status: { in: ['CONFIRMED', 'PENDING'] },
              OR: [
                {
                  AND: [
                    { checkIn: { lte: endDate } },
                    { checkOut: { gte: startDate } }
                  ]
                }
              ]
            }
          });

          if (existingBooking) {
            errors.push(`Conflict with existing booking ${existingBooking.reference}`);
            skipped++;
            continue;
          }

          // Créer une période bloquée pour cet événement
          await fastify.prisma.blockedPeriod.create({
            data: {
              propertyId,
              startDate,
              endDate,
              reason: 'Importé depuis iCal',
              notes: (event as any).summary || undefined
            }
          });

          imported++;
        } catch (error) {
          errors.push(`Error processing event ${uid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          skipped++;
        }
      }

      return reply.send({
        imported,
        skipped,
        errors
      });
    }
  );

  // Obtenir l'URL d'export iCal
  fastify.get<{
    Params: { propertyId: string }
  }>(
    '/export-url/:propertyId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Obtenir l\'URL d\'export iCal pour une propriété',
        tags: ['availability'],
        params: {
          type: 'object',
          properties: {
            propertyId: { type: 'string' }
          },
          required: ['propertyId']
        }
      }
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { propertyId } = request.params;

      // Vérifier que la propriété appartient au tenant
      const property = await fastify.prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId
        }
      });

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
      const exportUrl = `${baseUrl}/api/availability/ical/export/${propertyId}`;

      return reply.send({
        url: exportUrl,
        instructions: {
          google: 'Dans Google Calendar, cliquez sur "+" à côté de "Autres agendas", puis "À partir de l\'URL" et collez cette URL.',
          outlook: 'Dans Outlook.com, allez dans Paramètres > Afficher tous les paramètres Outlook > Calendrier > Calendriers partagés > Publier un calendrier.',
          apple: 'Dans l\'app Calendrier sur Mac, allez dans Fichier > Nouvel abonnement à un calendrier et collez cette URL.',
          airbnb: 'Dans votre calendrier Airbnb, cliquez sur "Disponibilité" > "Synchroniser les calendriers" > "Importer un calendrier" et collez cette URL.'
        }
      });
    }
  );
}