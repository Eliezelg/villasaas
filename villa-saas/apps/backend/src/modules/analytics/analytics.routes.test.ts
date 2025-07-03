import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';
import { PrismaClient } from '@villa-saas/database';

describe('Analytics Routes', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let accessToken: string;
  let tenantId: string;

  beforeEach(async () => {
    app = await buildApp({ logger: false });
    prisma = app.prisma;

    // Create test tenant and user
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Analytics Tenant',
        slug: 'test-analytics-tenant',
      },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: {
        email: 'analytics@test.com',
        password: '$2b$10$YourHashedPasswordHere',
        firstName: 'Analytics',
        lastName: 'Test',
        role: 'ADMIN',
        tenantId,
      },
    });

    // Generate access token
    accessToken = app.jwt.sign({ 
      userId: user.id, 
      tenantId,
      email: user.email,
      role: user.role
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.booking.deleteMany({ where: { tenantId } });
    await prisma.property.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    
    await app.close();
  });

  describe('GET /api/analytics/overview', () => {
    it('should return overview analytics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/overview',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('totalBookings');
      expect(data).toHaveProperty('totalRevenue');
      expect(data).toHaveProperty('averageStayDuration');
      expect(data).toHaveProperty('occupancyRate');
      expect(data).toHaveProperty('topProperties');
      expect(data).toHaveProperty('bookingSources');
    });

    it('should filter by date range', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/overview?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('totalBookings');
    });

    it('should filter by property', async () => {
      // Create a test property
      const property = await prisma.property.create({
        data: {
          name: 'Test Property',
          tenantId,
          propertyType: 'HOUSE',
          status: 'published',
          address: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'FR',
          maxGuests: 4,
          bedrooms: 2,
          bathrooms: 1,
          size: 100,
          basePrice: 100,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/analytics/overview?propertyId=${property.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/overview',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/analytics/occupancy', () => {
    it('should return occupancy data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/occupancy',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('totalDays');
      expect(data).toHaveProperty('occupiedDays');
      expect(data).toHaveProperty('occupancyRate');
      expect(data).toHaveProperty('monthlyData');
      expect(Array.isArray(data.monthlyData)).toBe(true);
    });
  });

  describe('GET /api/analytics/revenue', () => {
    it('should return revenue data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/revenue',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('totalRevenue');
      expect(data).toHaveProperty('averageRevenuePerNight');
      expect(data).toHaveProperty('averageRevenuePerBooking');
      expect(data).toHaveProperty('monthlyData');
      expect(Array.isArray(data.monthlyData)).toBe(true);
    });
  });

  describe('GET /api/analytics/export', () => {
    it('should export data as CSV', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/export',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.body).toContain('Villa SaaS - Analytics Report');
    });

    it('should include date range in export', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/export?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Period: 2025-01-01 to 2025-01-31');
    });
  });
});