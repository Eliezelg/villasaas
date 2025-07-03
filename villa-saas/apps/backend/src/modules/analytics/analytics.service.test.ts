import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AnalyticsService } from './analytics.service';
import { PrismaClient } from '@villa-saas/database';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Mock Prisma
jest.mock('@villa-saas/database', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    booking: {
      findMany: jest.fn(),
    },
    property: {
      findMany: jest.fn(),
    },
    blockedPeriod: {
      findMany: jest.fn(),
    },
  })),
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    service = new AnalyticsService(prisma);
  });

  describe('getOverview', () => {
    it('should return overview data with correct calculations', async () => {
      const tenantId = 'test-tenant';
      const dateRange = {
        startDate: startOfMonth(subMonths(new Date(), 2)),
        endDate: endOfMonth(new Date()),
      };

      const mockBookings = [
        {
          id: '1',
          property: { id: 'prop1', name: 'Villa Test' },
          total: 1000,
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          source: 'DIRECT',
        },
        {
          id: '2',
          property: { id: 'prop1', name: 'Villa Test' },
          total: 1500,
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
          source: 'AIRBNB',
        },
      ];

      const mockProperties = [{ id: 'prop1' }];
      const mockOccupancyBookings = mockBookings.map(b => ({
        propertyId: b.property.id,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
      }));

      (prisma.booking.findMany as jest.Mock).mockResolvedValueOnce(mockBookings);
      (prisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties);
      (prisma.booking.findMany as jest.Mock).mockResolvedValueOnce(mockOccupancyBookings);
      (prisma.blockedPeriod.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getOverview(tenantId, dateRange);

      expect(result.totalBookings).toBe(2);
      expect(result.totalRevenue).toBe(2500);
      expect(result.averageStayDuration).toBe(4); // (3 + 5) / 2
      expect(result.topProperties).toHaveLength(1);
      expect(result.topProperties[0]).toEqual({
        id: 'prop1',
        name: 'Villa Test',
        revenue: 2500,
        bookings: 2,
      });
      expect(result.bookingSources).toHaveLength(2);
    });

    it('should handle empty data gracefully', async () => {
      const tenantId = 'test-tenant';
      const dateRange = {
        startDate: startOfMonth(subMonths(new Date(), 2)),
        endDate: endOfMonth(new Date()),
      };

      (prisma.booking.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.property.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.booking.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.blockedPeriod.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getOverview(tenantId, dateRange);

      expect(result.totalBookings).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageStayDuration).toBe(0);
      expect(result.occupancyRate).toBe(0);
      expect(result.topProperties).toHaveLength(0);
      expect(result.bookingSources).toHaveLength(0);
    });
  });

  describe('getOccupancy', () => {
    it('should calculate occupancy rate correctly', async () => {
      const tenantId = 'test-tenant';
      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      };

      const mockProperties = [{ id: 'prop1' }];
      const mockBookings = [
        {
          propertyId: 'prop1',
          checkIn: new Date('2025-01-10'),
          checkOut: new Date('2025-01-15'), // 5 nights
        },
        {
          propertyId: 'prop1',
          checkIn: new Date('2025-01-20'),
          checkOut: new Date('2025-01-25'), // 5 nights
        },
      ];

      (prisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);
      (prisma.blockedPeriod.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getOccupancy(tenantId, dateRange);

      expect(result.totalDays).toBe(31); // January has 31 days
      expect(result.occupiedDays).toBe(12); // 6 + 6 days (includes checkout day)
      expect(result.occupancyRate).toBe(39); // 12/31 * 100
    });
  });

  describe('getRevenue', () => {
    it('should calculate revenue metrics correctly', async () => {
      const tenantId = 'test-tenant';
      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      };

      const mockBookings = [
        {
          total: 1000,
          checkIn: new Date('2025-01-10'),
          checkOut: new Date('2025-01-12'), // 2 nights
          createdAt: new Date('2025-01-05'),
        },
        {
          total: 1500,
          checkIn: new Date('2025-01-20'),
          checkOut: new Date('2025-01-23'), // 3 nights
          createdAt: new Date('2025-01-15'),
        },
      ];

      (prisma.booking.findMany as jest.Mock).mockResolvedValue(mockBookings);

      const result = await service.getRevenue(tenantId, dateRange);

      expect(result.totalRevenue).toBe(2500);
      expect(result.averageRevenuePerNight).toBe(500); // 2500 / 5 nights
      expect(result.averageRevenuePerBooking).toBe(1250); // 2500 / 2 bookings
      expect(result.monthlyData).toHaveLength(1);
      expect(result.monthlyData[0]).toEqual({
        month: 'January',
        year: 2025,
        revenue: 2500,
        bookings: 2,
      });
    });
  });

  describe('exportData', () => {
    it('should generate CSV buffer with correct data', async () => {
      const tenantId = 'test-tenant';
      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      };

      // Mock all the service methods
      jest.spyOn(service, 'getOverview').mockResolvedValue({
        totalBookings: 10,
        totalRevenue: 5000,
        averageStayDuration: 3.5,
        occupancyRate: 45,
        topProperties: [],
        bookingSources: [],
      });

      jest.spyOn(service, 'getOccupancy').mockResolvedValue({
        totalDays: 31,
        occupiedDays: 14,
        occupancyRate: 45,
        monthlyData: [],
      });

      jest.spyOn(service, 'getRevenue').mockResolvedValue({
        totalRevenue: 5000,
        averageRevenuePerNight: 357.14,
        averageRevenuePerBooking: 500,
        monthlyData: [],
      });

      const result = await service.exportData(tenantId, dateRange);

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString();
      expect(csvContent).toContain('Villa SaaS - Analytics Report');
      expect(csvContent).toContain('Total Bookings,10');
      expect(csvContent).toContain('Total Revenue,5000');
      expect(csvContent).toContain('Occupancy Rate,45%');
    });
  });
});