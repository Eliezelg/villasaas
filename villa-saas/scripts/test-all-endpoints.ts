#!/usr/bin/env ts-node

import axios, { AxiosInstance } from 'axios';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../apps/backend/.env') });

interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'failed';
  statusCode?: number;
  error?: string;
  duration: number;
  data?: any;
}

class EndpointTester {
  private apiClient: AxiosInstance;
  private results: TestResult[] = [];
  private tenantId: string = '';
  private userId: string = '';
  private authToken: string = '';
  private propertyId: string = '';
  private bookingId: string = '';
  private imageId: string = '';

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3001',
      timeout: 10000,
    });
  }

  private async testEndpoint(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    authenticated = true
  ): Promise<TestResult> {
    const startTime = Date.now();
    const headers = authenticated && this.authToken 
      ? { Authorization: `Bearer ${this.authToken}` }
      : {};

    try {
      const response = await this.apiClient.request({
        method,
        url: endpoint,
        data,
        headers,
      });

      const result: TestResult = {
        endpoint,
        method,
        status: 'success',
        statusCode: response.status,
        duration: Date.now() - startTime,
        data: response.data,
      };

      this.results.push(result);
      console.log(`✅ ${method} ${endpoint} - ${response.status}`);
      return result;
    } catch (error: any) {
      const result: TestResult = {
        endpoint,
        method,
        status: 'failed',
        statusCode: error.response?.status,
        error: error.response?.data?.error || error.message,
        duration: Date.now() - startTime,
      };

      this.results.push(result);
      console.log(`❌ ${method} ${endpoint} - ${error.response?.status || 'ERROR'}: ${result.error}`);
      return result;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive API endpoint tests...\n');

    // 1. Create tenant
    await this.testTenantCreation();

    // 2. Test authentication
    await this.testAuthentication();

    // 3. Test property management
    await this.testPropertyManagement();

    // 4. Test bookings
    await this.testBookings();

    // 5. Test pricing
    await this.testPricing();

    // 6. Test availability
    await this.testAvailability();

    // 7. Test analytics
    await this.testAnalytics();

    // 8. Test messaging
    await this.testMessaging();

    // 9. Test payments
    await this.testPayments();

    // 10. Generate report
    this.generateReport();
  }

  private async testTenantCreation() {
    console.log('\n📋 Testing Tenant Creation...');

    // Create a new tenant
    const tenantData = {
      name: faker.company.name(),
      domain: faker.internet.domainName(),
      email: faker.internet.email(),
      settings: {
        currency: 'EUR',
        language: 'fr',
        timezone: 'Europe/Paris',
      },
    };

    const result = await this.testEndpoint('POST', '/api/tenants', tenantData, false);
    if (result.status === 'success' && result.data) {
      this.tenantId = result.data.id;
      console.log(`✨ Created tenant: ${this.tenantId}`);
    }
  }

  private async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');

    // Register a new user
    const registerData = {
      email: faker.internet.email(),
      password: 'Test123!@#',
      name: faker.person.fullName(),
      tenantId: this.tenantId,
      role: 'OWNER',
    };

    const registerResult = await this.testEndpoint('POST', '/api/auth/register', registerData, false);
    
    if (registerResult.status === 'success') {
      // Login
      const loginData = {
        email: registerData.email,
        password: registerData.password,
      };

      const loginResult = await this.testEndpoint('POST', '/api/auth/login', loginData, false);
      
      if (loginResult.status === 'success' && loginResult.data) {
        this.authToken = loginResult.data.accessToken;
        this.userId = loginResult.data.user.id;
        console.log(`✨ Authenticated as user: ${this.userId}`);
      }

      // Test authenticated endpoints
      await this.testEndpoint('GET', '/api/auth/me');
      await this.testEndpoint('POST', '/api/auth/refresh', { 
        refreshToken: loginResult.data?.refreshToken 
      }, false);
      await this.testEndpoint('POST', '/api/auth/logout');
    }
  }

  private async testPropertyManagement() {
    console.log('\n🏠 Testing Property Management...');

    // Create property
    const propertyData = {
      name: faker.location.streetAddress(),
      description: faker.lorem.paragraphs(2),
      type: 'VILLA',
      status: 'PUBLISHED',
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      country: 'France',
      postalCode: faker.location.zipCode(),
      maxGuests: faker.number.int({ min: 2, max: 12 }),
      bedrooms: faker.number.int({ min: 1, max: 6 }),
      bathrooms: faker.number.int({ min: 1, max: 4 }),
      surfaceArea: faker.number.int({ min: 50, max: 300 }),
      basePrice: faker.number.int({ min: 100, max: 1000 }),
      amenities: ['wifi', 'pool', 'parking', 'kitchen'],
    };

    const createResult = await this.testEndpoint('POST', '/api/properties', propertyData);
    
    if (createResult.status === 'success' && createResult.data) {
      this.propertyId = createResult.data.id;
      console.log(`✨ Created property: ${this.propertyId}`);

      // Test other property endpoints
      await this.testEndpoint('GET', '/api/properties');
      await this.testEndpoint('GET', `/api/properties/${this.propertyId}`);
      await this.testEndpoint('PUT', `/api/properties/${this.propertyId}`, {
        ...propertyData,
        name: 'Updated ' + propertyData.name,
      });

      // Test image upload
      await this.testPropertyImages();

      // Add pricing periods
      await this.testPricingPeriods();
    }
  }

  private async testPropertyImages() {
    console.log('\n📸 Testing Property Images...');

    // Create image metadata
    const imageData = {
      filename: 'test-image.jpg',
      url: faker.image.url(),
      urls: {
        small: faker.image.url(),
        medium: faker.image.url(),
        large: faker.image.url(),
        original: faker.image.url(),
      },
      order: 1,
    };

    const createResult = await this.testEndpoint(
      'POST',
      `/api/properties/${this.propertyId}/images`,
      imageData
    );

    if (createResult.status === 'success' && createResult.data) {
      this.imageId = createResult.data.id;

      // Test other image endpoints
      await this.testEndpoint('GET', `/api/properties/${this.propertyId}/images`);
      await this.testEndpoint('PUT', `/api/properties/images/${this.imageId}/reorder`, {
        order: 2,
      });
      await this.testEndpoint('DELETE', `/api/properties/images/${this.imageId}`);
    }
  }

  private async testPricingPeriods() {
    console.log('\n💰 Testing Pricing Periods...');

    const periodData = {
      name: 'High Season',
      startDate: '2025-07-01T00:00:00Z',
      endDate: '2025-08-31T23:59:59Z',
      nightlyRate: 500,
      weeklyRate: 3000,
      monthlyRate: 10000,
      minimumStay: 7,
      priority: 10,
    };

    await this.testEndpoint('POST', `/api/properties/${this.propertyId}/pricing-periods`, periodData);
    await this.testEndpoint('GET', `/api/properties/${this.propertyId}/pricing-periods`);
  }

  private async testBookings() {
    console.log('\n📅 Testing Bookings...');

    const bookingData = {
      propertyId: this.propertyId,
      checkIn: faker.date.future().toISOString().split('T')[0],
      checkOut: faker.date.future().toISOString().split('T')[0],
      guests: faker.number.int({ min: 1, max: 4 }),
      guestName: faker.person.fullName(),
      guestEmail: faker.internet.email(),
      guestPhone: faker.phone.number(),
      status: 'CONFIRMED',
      total: faker.number.int({ min: 1000, max: 5000 }),
      notes: faker.lorem.sentence(),
    };

    const createResult = await this.testEndpoint('POST', '/api/bookings', bookingData);

    if (createResult.status === 'success' && createResult.data) {
      this.bookingId = createResult.data.id;
      console.log(`✨ Created booking: ${this.bookingId}`);

      // Test other booking endpoints
      await this.testEndpoint('GET', '/api/bookings');
      await this.testEndpoint('GET', `/api/bookings/${this.bookingId}`);
      await this.testEndpoint('PATCH', `/api/bookings/${this.bookingId}/status`, {
        status: 'COMPLETED',
      });
    }
  }

  private async testPricing() {
    console.log('\n💵 Testing Pricing Calculation...');

    const pricingData = {
      propertyId: this.propertyId,
      checkIn: '2025-07-15',
      checkOut: '2025-07-22',
      guests: 4,
    };

    await this.testEndpoint('POST', '/api/pricing/calculate', pricingData);
  }

  private async testAvailability() {
    console.log('\n📆 Testing Availability...');

    await this.testEndpoint('GET', `/api/availability/${this.propertyId}`);
    await this.testEndpoint('POST', '/api/availability/check', {
      propertyId: this.propertyId,
      checkIn: '2025-08-01',
      checkOut: '2025-08-08',
    });

    // Block dates
    await this.testEndpoint('POST', `/api/availability/${this.propertyId}/block`, {
      startDate: '2025-09-01',
      endDate: '2025-09-07',
      reason: 'Maintenance',
    });

    // Sync iCal
    await this.testEndpoint('POST', `/api/availability/${this.propertyId}/sync-ical`, {
      url: 'https://example.com/calendar.ics',
    });
  }

  private async testAnalytics() {
    console.log('\n📊 Testing Analytics...');

    await this.testEndpoint('GET', '/api/analytics/overview');
    await this.testEndpoint('GET', '/api/analytics/revenue?startDate=2025-01-01T00:00:00Z&endDate=2025-12-31T23:59:59Z');
    await this.testEndpoint('GET', '/api/analytics/occupancy');
    await this.testEndpoint('POST', '/api/analytics/export', {
      type: 'bookings',
      format: 'csv',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });
  }

  private async testMessaging() {
    console.log('\n💬 Testing Messaging...');

    const messageData = {
      bookingId: this.bookingId,
      content: faker.lorem.sentence(),
      sender: 'OWNER',
    };

    await this.testEndpoint('POST', '/api/messaging', messageData);
    await this.testEndpoint('GET', `/api/messaging/booking/${this.bookingId}`);
    await this.testEndpoint('GET', '/api/messaging/conversations');
  }

  private async testPayments() {
    console.log('\n💳 Testing Payments...');

    // Note: These are mock tests as Stripe integration requires valid keys
    await this.testEndpoint('POST', '/api/payments/create-session', {
      bookingId: this.bookingId,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    await this.testEndpoint('GET', `/api/payments/booking/${this.bookingId}`);
    await this.testEndpoint('GET', '/api/payments/transactions');
  }

  private generateReport() {
    console.log('\n📊 Generating Test Report...\n');

    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.status === 'success').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const successRate = ((successfulTests / totalTests) * 100).toFixed(2);

    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Successful: ${successfulTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(60));

    // Group by endpoint category
    const categories = {
      'Authentication': this.results.filter(r => r.endpoint.includes('/api/auth')),
      'Properties': this.results.filter(r => r.endpoint.includes('/api/properties')),
      'Bookings': this.results.filter(r => r.endpoint.includes('/api/bookings')),
      'Pricing': this.results.filter(r => r.endpoint.includes('/api/pricing')),
      'Availability': this.results.filter(r => r.endpoint.includes('/api/availability')),
      'Analytics': this.results.filter(r => r.endpoint.includes('/api/analytics')),
      'Messaging': this.results.filter(r => r.endpoint.includes('/api/messaging')),
      'Payments': this.results.filter(r => r.endpoint.includes('/api/payments')),
    };

    console.log('\nDETAILED RESULTS BY CATEGORY:');
    console.log('-'.repeat(60));

    Object.entries(categories).forEach(([category, results]) => {
      if (results.length > 0) {
        const categorySuccess = results.filter(r => r.status === 'success').length;
        const categoryTotal = results.length;
        console.log(`\n${category}: ${categorySuccess}/${categoryTotal}`);
        
        results.forEach(result => {
          const icon = result.status === 'success' ? '✅' : '❌';
          console.log(`  ${icon} ${result.method} ${result.endpoint} (${result.duration}ms)`);
          if (result.error) {
            console.log(`     Error: ${result.error}`);
          }
        });
      }
    });

    // Save report to file
    const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Show failed tests details
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS DETAILS:');
      console.log('-'.repeat(60));
      this.results
        .filter(r => r.status === 'failed')
        .forEach(result => {
          console.log(`\n${result.method} ${result.endpoint}`);
          console.log(`Status Code: ${result.statusCode || 'N/A'}`);
          console.log(`Error: ${result.error}`);
        });
    }
  }
}

// Run tests
async function main() {
  const tester = new EndpointTester();
  await tester.runAllTests();
}

main().catch(console.error);