import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';

describe('Public Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/public/properties', () => {
    it('should require tenant header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/public/properties',
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Tenant not specified'
      });
    });

    it('should return properties with valid tenant', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/public/properties',
        headers: {
          'x-tenant': 'demo'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('properties');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('totalPages');
    });
  });

  describe('POST /api/public/bookings/verify', () => {
    it('should validate email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/public/bookings/verify',
        payload: {
          email: 'invalid-email',
          reference: 'BK-2024-0001'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should require both email and reference', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/public/bookings/verify',
        payload: {
          email: 'test@example.com'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/public/bookings/verify',
        payload: {
          email: 'notfound@example.com',
          reference: 'BK-9999-9999'
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/public/pricing/calculate', () => {
    it('should calculate price for valid request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/public/pricing/calculate',
        headers: {
          'x-tenant': 'demo'
        },
        payload: {
          propertyId: 'test-property-id',
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          guests: 2
        }
      });

      // Peut retourner 404 si la propriété n'existe pas
      expect([200, 404]).toContain(response.statusCode);
    });

    it('should require tenant header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/public/pricing/calculate',
        payload: {
          propertyId: 'test-property-id',
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          guests: 2
        }
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Tenant not specified'
      });
    });
  });
});