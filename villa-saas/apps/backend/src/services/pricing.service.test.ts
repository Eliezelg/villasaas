import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PricingService } from './pricing.service';
import { addDays } from 'date-fns';

describe('PricingService', () => {
  let pricingService: PricingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      property: {
        findUnique: jest.fn(),
        findFirst: jest.fn()
      },
      pricingPeriod: {
        findMany: jest.fn()
      },
      period: {
        findMany: jest.fn()
      }
    };
    pricingService = new PricingService(mockPrisma);
  });

  describe('calculatePrice', () => {
    const baseProperty = {
      id: 'prop-1',
      basePrice: 100,
      cleaningFee: 50,
      securityDeposit: 200,
      touristTax: 2,
      weekendSupplement: true,
      longStayDiscount: true,
      minStay: 2,
      maxGuests: 4
    };

    it('should calculate price for a basic stay', async () => {
      const checkIn = new Date('2024-07-15');
      const checkOut = new Date('2024-07-18'); // 3 nights

      mockPrisma.property.findFirst.mockResolvedValue(baseProperty);
      mockPrisma.period.findMany.mockResolvedValue([]);

      const result = await pricingService.calculatePrice({
        propertyId: 'prop-1',
        checkIn,
        checkOut,
        guests: 2,
        tenantId: 'tenant-1'
      });

      expect(result).toMatchObject({
        nights: 3,
        basePrice: 100,
        totalAccommodation: 300, // 3 nights * 100
        cleaningFee: 50,
        securityDeposit: 200,
        touristTax: 6, // 3 nights * 2
        subtotal: 356, // 300 + 50 + 6
        total: 356
      });
    });

    it('should apply weekend supplement', async () => {
      // Friday to Sunday (2 nights, both weekend)
      const checkIn = new Date('2024-07-19'); // Friday
      const checkOut = new Date('2024-07-21'); // Sunday

      mockPrisma.property.findFirst.mockResolvedValue(baseProperty);
      mockPrisma.period.findMany.mockResolvedValue([]);

      const result = await pricingService.calculatePrice({
        propertyId: 'prop-1',
        checkIn,
        checkOut,
        guests: 2,
        tenantId: 'tenant-1'
      });

      // 2 weekend nights * 100 * 1.2 (20% supplement) = 240
      expect(result.totalAccommodation).toBe(240);
    });

    it('should apply long stay discount for 7+ nights', async () => {
      const checkIn = new Date('2024-07-15');
      const checkOut = new Date('2024-07-22'); // 7 nights

      mockPrisma.property.findFirst.mockResolvedValue(baseProperty);
      mockPrisma.period.findMany.mockResolvedValue([]);

      const result = await pricingService.calculatePrice({
        propertyId: 'prop-1',
        checkIn,
        checkOut,
        guests: 2,
        tenantId: 'tenant-1'
      });

      // Base: 7 * 100 = 700
      // Discount: 5% = 35
      expect(result.longStayDiscount).toBe(35);
      expect(result.total).toBe(700 + 50 + 14 - 35); // accommodation + cleaning + tax - discount
    });

    it('should apply pricing period rates', async () => {
      const checkIn = new Date('2024-07-15');
      const checkOut = new Date('2024-07-18');

      mockPrisma.property.findFirst.mockResolvedValue(baseProperty);
      mockPrisma.period.findMany.mockResolvedValue([
        {
          id: 'period-1',
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-08-31'),
          nightly: 150, // High season
          priority: 1
        }
      ]);

      const result = await pricingService.calculatePrice({
        propertyId: 'prop-1',
        checkIn,
        checkOut,
        guests: 2,
        tenantId: 'tenant-1'
      });

      expect(result.totalAccommodation).toBe(450); // 3 nights * 150
    });

    it('should throw error if property not found', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(null);

      await expect(
        pricingService.calculatePrice({
          propertyId: 'invalid',
          checkIn: new Date(),
          checkOut: addDays(new Date(), 1),
          guests: 2,
          tenantId: 'tenant-1'
        })
      ).rejects.toThrow('Property not found');
    });

    it('should throw error if too many guests', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(baseProperty);

      await expect(
        pricingService.calculatePrice({
          propertyId: 'prop-1',
          checkIn: new Date(),
          checkOut: addDays(new Date(), 1),
          guests: 10, // More than maxGuests (4)
          tenantId: 'tenant-1'
        })
      ).rejects.toThrow('Maximum 4 guests allowed');
    });
  });
});