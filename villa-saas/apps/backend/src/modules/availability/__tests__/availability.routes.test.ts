import { FastifyInstance } from 'fastify';
import { buildApp } from '../../../app';
import { createTenant, createUser, generateToken, cleanDatabase } from '../../../__tests__/helpers/test-utils';

describe('Availability Routes', () => {
  let app: FastifyInstance;
  let authToken: string;
  let tenantId: string;
  let propertyId: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await cleanDatabase(app.prisma);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app.prisma);

    // Créer un tenant et un utilisateur de test
    const tenant = await createTenant(app.prisma);
    tenantId = tenant.id;

    const user = await createUser(app.prisma, tenantId);
    authToken = generateToken(app, { id: user.id, tenantId });

    // Créer une propriété de test
    const property = await app.prisma.property.create({
      data: {
        tenantId,
        name: 'Test Property',
        slug: 'test-property',
        propertyType: 'APARTMENT',
        status: 'PUBLISHED',
        address: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'FR',
        bedrooms: 2,
        bathrooms: 1,
        maxGuests: 4,
        basePrice: 100,
        minNights: 2,
        description: { fr: 'Description test' }
      }
    });
    propertyId = property.id;
  });

  describe('POST /api/availability/blocked-periods', () => {
    it('should create a blocked period', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const response = await app.inject({
        method: 'POST',
        url: '/api/availability/blocked-periods',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          propertyId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Maintenance',
          notes: 'Annual maintenance'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        propertyId,
        reason: 'Maintenance',
        notes: 'Annual maintenance'
      });
    });

    it('should reject if end date is before start date', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/availability/blocked-periods',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          propertyId,
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-10T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject if property not found', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/availability/blocked-periods',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          propertyId: 'invalid-id',
          startDate: '2024-01-10T00:00:00Z',
          endDate: '2024-01-15T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/availability/blocked-periods', () => {
    it('should list blocked periods for a property', async () => {
      // Créer quelques périodes bloquées
      await app.prisma.blockedPeriod.createMany({
        data: [
          {
            propertyId,
            startDate: new Date('2024-01-10'),
            endDate: new Date('2024-01-15'),
            reason: 'Maintenance'
          },
          {
            propertyId,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-05'),
            reason: 'Personal use'
          }
        ]
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/availability/blocked-periods?propertyId=${propertyId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
      expect(body[0].reason).toBe('Maintenance');
      expect(body[1].reason).toBe('Personal use');
    });
  });

  describe('POST /api/availability/check-availability', () => {
    beforeEach(async () => {
      // Créer une réservation existante
      await app.prisma.booking.create({
        data: {
          tenantId,
          propertyId,
          reference: 'TEST-001',
          checkIn: new Date('2024-01-15'),
          checkOut: new Date('2024-01-20'),
          nights: 5,
          adults: 2,
          guestFirstName: 'John',
          guestLastName: 'Doe',
          guestEmail: 'john@example.com',
          guestPhone: '+33123456789',
          status: 'CONFIRMED',
          accommodationTotal: 500,
          subtotal: 500,
          total: 500,
          commissionRate: 0.15,
          commissionAmount: 75,
          payoutAmount: 425
        }
      });

      // Créer une période bloquée
      await app.prisma.blockedPeriod.create({
        data: {
          propertyId,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-05')
        }
      });
    });

    it('should return available for free dates', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/availability/check-availability',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          propertyId,
          checkIn: '2024-03-01T00:00:00Z',
          checkOut: '2024-03-05T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.available).toBe(true);
    });

    it('should return unavailable for booked dates', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/availability/check-availability',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          propertyId,
          checkIn: '2024-01-14T00:00:00Z',
          checkOut: '2024-01-18T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.available).toBe(false);
      expect(body.conflicts).toHaveLength(1);
      expect(body.conflicts[0].type).toBe('booking');
    });

    it('should return unavailable for blocked dates', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/availability/check-availability',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          propertyId,
          checkIn: '2024-01-31T00:00:00Z',
          checkOut: '2024-02-03T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.available).toBe(false);
      expect(body.conflicts).toHaveLength(1);
      expect(body.conflicts[0].type).toBe('blocked');
    });
  });

  describe('GET /api/availability/availability-calendar', () => {
    it('should return calendar with availability and pricing', async () => {
      // Créer une période tarifaire
      await app.prisma.period.create({
        data: {
          tenantId,
          propertyId,
          name: 'High Season',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          basePrice: 150,
          weekendPremium: 20,
          priority: 1
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/availability/availability-calendar?propertyId=${propertyId}&startDate=2024-01-01T00:00:00Z&endDate=2024-01-07T00:00:00Z`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.propertyId).toBe(propertyId);
      expect(body.dates).toHaveLength(7);
      
      // Vérifier les prix (1er janvier = lundi)
      expect(body.dates[0].price).toBe(150); // Lundi
      expect(body.dates[4].price).toBe(170); // Vendredi (avec supplément weekend)
      expect(body.dates[5].price).toBe(170); // Samedi
    });

    it('should mark past dates as unavailable', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await app.inject({
        method: 'GET',
        url: `/api/availability/availability-calendar?propertyId=${propertyId}&startDate=${yesterday.toISOString()}&endDate=${tomorrow.toISOString()}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      // Le premier jour (hier) devrait être marqué comme passé
      expect(body.dates[0].available).toBe(false);
      expect(body.dates[0].reason).toBe('past');
    });
  });
});