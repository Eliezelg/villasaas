import { describe, it, expect, jest } from '@jest/globals';
import { MockEmailService } from './email.service';
import { FastifyInstance } from 'fastify';

describe('EmailService', () => {
  let mockFastify: any;
  let emailService: MockEmailService;

  beforeEach(() => {
    mockFastify = {
      log: {
        info: jest.fn(),
        error: jest.fn()
      }
    };
    emailService = new MockEmailService(mockFastify);
  });

  describe('MockEmailService', () => {
    it('should log booking confirmation email', async () => {
      const params = {
        to: 'test@example.com',
        bookingReference: 'BK-2024-0001',
        guestName: 'John Doe',
        propertyName: 'Villa Paradise',
        checkIn: '2024-07-15',
        checkOut: '2024-07-22',
        guests: 4,
        totalAmount: 1200,
        currency: 'EUR'
      };

      await emailService.sendBookingConfirmation(params);

      expect(mockFastify.log.info).toHaveBeenCalledWith(
        { params },
        'Mock: Sending booking confirmation email'
      );
    });

    it('should log owner notification email', async () => {
      const params = {
        to: 'owner@example.com',
        bookingReference: 'BK-2024-0001',
        propertyName: 'Villa Paradise',
        guestName: 'John Doe',
        checkIn: '2024-07-15',
        checkOut: '2024-07-22',
        guests: 4,
        totalAmount: 1200
      };

      await emailService.sendBookingNotificationToOwner(params);

      expect(mockFastify.log.info).toHaveBeenCalledWith(
        { params },
        'Mock: Sending owner notification email'
      );
    });

    it('should log check-in reminder', async () => {
      const params = {
        to: 'guest@example.com',
        guestName: 'John Doe',
        propertyName: 'Villa Paradise',
        checkIn: '2024-07-15',
        bookingReference: 'BK-2024-0001'
      };

      await emailService.sendCheckInReminder(params);

      expect(mockFastify.log.info).toHaveBeenCalledWith(
        { params },
        'Mock: Sending check-in reminder email'
      );
    });
  });
});