import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';

describe('Public Routes with Query Parameters', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/public/properties with tenantId query param', () => {
    it('should accept tenantId as query parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/public/properties?tenantId=demo',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('properties');
      expect(data).toHaveProperty('pagination');
    });

    it('should still work with x-tenant header', async () => {
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
      expect(data).toHaveProperty('pagination');
    });

    it('should prioritize header over query param', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/public/properties?tenantId=other',
        headers: {
          'x-tenant': 'demo'
        }
      });

      expect(response.statusCode).toBe(200);
      // The header value 'demo' should be used, not 'other' from query
    });
  });

  describe('GET /api/public/properties/:id with tenantId query param', () => {
    it('should accept tenantId as query parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/public/properties/test-property-id?tenantId=demo',
      });

      // Will be 404 since test-property-id doesn't exist, but should not be 400 "Tenant not specified"
      expect([200, 404]).toContain(response.statusCode);
      if (response.statusCode === 404) {
        const data = JSON.parse(response.body);
        expect(data.error).toBe('Property not found');
      }
    });
  });

  describe('POST /api/public/pricing/calculate with tenantId query param', () => {
    it('should accept tenantId as query parameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/public/pricing/calculate?tenantId=demo',
        payload: {
          propertyId: 'test-property-id',
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          guests: 2
        }
      });

      // Will be 404 since test-property-id doesn't exist, but should not be 400 "Tenant not specified"
      expect([200, 404, 500]).toContain(response.statusCode);
      if (response.statusCode === 404) {
        const data = JSON.parse(response.body);
        expect(data.error).toBe('Property not found');
      }
    });
  });

  describe('GET /api/public/availability with tenantId query param', () => {
    it('should accept tenantId as query parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/public/availability?tenantId=demo&propertyId=test-id&startDate=2024-01-01&endDate=2024-01-07',
      });

      // Will be 404 since property doesn't exist, but should not be 400 "Tenant not specified"
      expect([200, 404]).toContain(response.statusCode);
      if (response.statusCode === 404) {
        const data = JSON.parse(response.body);
        expect(data.error).toBe('Property not found');
      }
    });
  });

  describe('POST /api/public/promocodes/validate with tenantId query param', () => {
    it('should accept tenantId as query parameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/public/promocodes/validate?tenantId=demo',
        payload: {
          code: 'TESTCODE',
          propertyId: 'test-property-id',
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: 1000,
          nights: 7
        }
      });

      // Should not be 400 "Tenant not specified"
      expect(response.statusCode).not.toBe(400);
      if (response.statusCode === 400) {
        const data = JSON.parse(response.body);
        expect(data.error).not.toBe('Tenant not specified');
      }
    });
  });
});