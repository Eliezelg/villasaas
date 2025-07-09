#!/usr/bin/env tsx

import axios, { AxiosInstance } from 'axios';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@villa-saas/database';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../apps/backend/.env') });

const prisma = new PrismaClient();

interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'failed';
  statusCode?: number;
  error?: string;
  duration: number;
  data?: any;
}

class ComprehensiveEndpointTester {
  private apiClient: AxiosInstance;
  private results: TestResult[] = [];
  private tenantId: string = '';
  private userId: string = '';
  private authToken: string = '';
  private refreshToken: string = '';
  private propertyId: string = '';
  private bookingId: string = '';
  private imageId: string = '';
  private periodId: string = '';

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3001',
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
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

      const success = response.status >= 200 && response.status < 300;
      const result: TestResult = {
        endpoint,
        method,
        status: success ? 'success' : 'failed',
        statusCode: response.status,
        duration: Date.now() - startTime,
        data: response.data,
        error: !success ? (response.data?.error || response.data?.message || response.statusText) : undefined,
      };

      this.results.push(result);
      
      const icon = success ? '✅' : '❌';
      const errorMsg = result.error ? `: ${result.error}` : '';
      console.log(`${icon} ${method} ${endpoint} - ${response.status}${errorMsg}`);
      
      return result;
    } catch (error: any) {
      const result: TestResult = {
        endpoint,
        method,
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime,
      };

      this.results.push(result);
      console.log(`❌ ${method} ${endpoint} - ERROR: ${error.message}`);
      return result;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive API endpoint tests...\n');

    try {
      // 1. Setup: Create tenant directly in DB for testing
      await this.setupTestTenant();

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

      // 10. Test public endpoints
      await this.testPublicEndpoints();

    } finally {
      // Cleanup
      await this.cleanup();
      
      // Generate report
      this.generateReport();
    }
  }

  private async setupTestTenant() {
    console.log('\n📋 Setting up test tenant...');

    try {
      // Create tenant directly in database
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant ' + faker.company.name(),
          subdomain: 'test-' + faker.internet.domainWord(),
          email: faker.internet.email(),
          settings: {
            currency: 'EUR',
            language: 'fr',
            timezone: 'Europe/Paris',
          },
        },
      });

      this.tenantId = tenant.id;
      console.log(`✨ Created test tenant: ${this.tenantId}`);
    } catch (error) {
      console.error('Failed to create test tenant:', error);
      throw error;
    }
  }

  private async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');

    // Test registration
    const fullName = faker.person.fullName();
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || 'Test';
    
    const registerData = {
      email: faker.internet.email(),
      password: 'Test123!@#',
      firstName,
      lastName,
      companyName: faker.company.name(),
      phone: faker.phone.number('+33 6 ## ## ## ##'),
    };

    const registerResult = await this.testEndpoint('POST', '/api/auth/register', registerData, false);
    
    if (registerResult.status === 'success') {
      this.userId = registerResult.data.user.id;
      this.authToken = registerResult.data.accessToken;
      this.refreshToken = registerResult.data.refreshToken;

      // Test login with the same credentials
      const loginData = {
        email: registerData.email,
        password: registerData.password,
      };

      await this.testEndpoint('POST', '/api/auth/login', loginData, false);
      
      // Test authenticated endpoints
      await this.testEndpoint('GET', '/api/auth/me');
      
      // Test refresh token
      await this.testEndpoint('POST', '/api/auth/refresh', { 
        refreshToken: this.refreshToken 
      }, false);
      
      // Test logout
      await this.testEndpoint('POST', '/api/auth/logout');
      
      // Re-login for subsequent tests
      const reLoginResult = await this.testEndpoint('POST', '/api/auth/login', loginData, false);
      if (reLoginResult.status === 'success') {
        this.authToken = reLoginResult.data.accessToken;
        this.refreshToken = reLoginResult.data.refreshToken;
      }
    }
  }

  private async testPropertyManagement() {
    console.log('\n🏠 Testing Property Management...');

    // Create property
    const propertyData = {
      name: 'Villa ' + faker.location.street(),
      description: faker.lorem.paragraphs(2),
      propertyType: 'VILLA',
      status: 'PUBLISHED',
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      country: 'France',
      postalCode: faker.location.zipCode('#####'),
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude()),
      maxGuests: faker.number.int({ min: 2, max: 12 }),
      bedrooms: faker.number.int({ min: 1, max: 6 }),
      bathrooms: faker.number.int({ min: 1, max: 4 }),
      surfaceArea: faker.number.int({ min: 50, max: 300 }),
      basePrice: faker.number.int({ min: 100, max: 1000 }),
      amenities: ['wifi', 'pool', 'parking', 'kitchen', 'airConditioning'],
      features: {
        hasPool: true,
        hasGarden: true,
        hasParking: true,
        parkingSpaces: 2,
      },
    };

    const createResult = await this.testEndpoint('POST', '/api/properties', propertyData);
    
    if (createResult.status === 'success' && createResult.data) {
      this.propertyId = createResult.data.id;
      console.log(`✨ Created property: ${this.propertyId}`);

      // Test other property endpoints
      await this.testEndpoint('GET', '/api/properties');
      await this.testEndpoint('GET', `/api/properties/${this.propertyId}`);
      
      // Update property
      await this.testEndpoint('PUT', `/api/properties/${this.propertyId}`, {
        ...propertyData,
        name: 'Updated ' + propertyData.name,
        maxGuests: 10,
      });

      // Test property images
      await this.testPropertyImages();

      // Test pricing periods
      await this.testPricingPeriods();
    }
  }

  private async testPropertyImages() {
    console.log('\n📸 Testing Property Images...');

    // Test image upload metadata (S3 version)
    const imageData = {
      url: faker.image.url(),
      key: `properties/${this.propertyId}/test-image-${Date.now()}.jpg`,
      size: faker.number.int({ min: 100000, max: 5000000 }),
      order: 1,
    };

    const createResult = await this.testEndpoint(
      'POST',
      `/api/properties/${this.propertyId}/images`,
      imageData
    );

    if (createResult.status === 'success' && createResult.data) {
      this.imageId = createResult.data.id;

      // Test get images
      await this.testEndpoint('GET', `/api/properties/${this.propertyId}/images`);
      
      // Test reorder
      await this.testEndpoint('PUT', `/api/properties/${this.propertyId}/images/${this.imageId}/reorder`, {
        order: 2,
      });
      
      // Test delete
      await this.testEndpoint('DELETE', `/api/properties/${this.propertyId}/images/${this.imageId}`);
    }
  }

  private async testPricingPeriods() {
    console.log('\n💰 Testing Pricing Periods...');

    const periodData = {
      name: 'High Season 2025',
      startDate: '2025-07-01T00:00:00.000Z',
      endDate: '2025-08-31T23:59:59.000Z',
      nightlyRate: 500,
      weeklyRate: 3000,
      monthlyRate: 10000,
      minimumStay: 7,
      priority: 10,
    };

    const createResult = await this.testEndpoint('POST', `/api/periods`, {
      ...periodData,
      propertyId: this.propertyId,
    });

    if (createResult.status === 'success' && createResult.data) {
      this.periodId = createResult.data.id;

      // Get periods for property
      await this.testEndpoint('GET', `/api/properties/${this.propertyId}/pricing-periods`);
      
      // Update period
      await this.testEndpoint('PUT', `/api/periods/${this.periodId}`, {
        ...periodData,
        nightlyRate: 600,
      });
      
      // Delete period
      await this.testEndpoint('DELETE', `/api/periods/${this.periodId}`);
    }
  }

  private async testBookings() {
    console.log('\n📅 Testing Bookings...');

    // First ensure we have valid dates
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 30); // 30 days from now
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 7); // 7 days stay

    const bookingData = {
      propertyId: this.propertyId,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      guests: 4,
      guestName: faker.person.fullName(),
      guestEmail: faker.internet.email(),
      guestPhone: faker.phone.number('+33 6 ## ## ## ##'),
      status: 'CONFIRMED',
      total: 3500,
      notes: 'Test booking from API test',
      source: 'DIRECT',
    };

    const createResult = await this.testEndpoint('POST', '/api/bookings', bookingData);

    if (createResult.status === 'success' && createResult.data) {
      this.bookingId = createResult.data.id;
      console.log(`✨ Created booking: ${this.bookingId}`);

      // Get all bookings
      await this.testEndpoint('GET', '/api/bookings');
      
      // Get single booking
      await this.testEndpoint('GET', `/api/bookings/${this.bookingId}`);
      
      // Update booking status
      await this.testEndpoint('PATCH', `/api/bookings/${this.bookingId}/status`, {
        status: 'COMPLETED',
      });
      
      // Test booking stats
      await this.testEndpoint('GET', '/api/bookings/stats');
    }
  }

  private async testPricing() {
    console.log('\n💵 Testing Pricing Calculation...');

    const pricingData = {
      propertyId: this.propertyId,
      checkIn: '2025-07-15T00:00:00.000Z',
      checkOut: '2025-07-22T00:00:00.000Z',
      guests: 4,
    };

    await this.testEndpoint('POST', '/api/pricing/calculate', pricingData);
    
    // Test quote generation
    await this.testEndpoint('POST', '/api/pricing/quote', {
      ...pricingData,
      includeExtras: true,
    });
  }

  private async testAvailability() {
    console.log('\n📆 Testing Availability...');

    // Get availability calendar
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    
    await this.testEndpoint(
      'GET', 
      `/api/availability/availability-calendar?propertyId=${this.propertyId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    
    // Check specific dates
    await this.testEndpoint('POST', '/api/availability/check-availability', {
      propertyId: this.propertyId,
      checkIn: '2025-08-01T00:00:00.000Z',
      checkOut: '2025-08-08T00:00:00.000Z',
    });

    // Block dates
    const blockResult = await this.testEndpoint('POST', '/api/availability/blocked-periods', {
      propertyId: this.propertyId,
      startDate: '2025-09-01T00:00:00.000Z',
      endDate: '2025-09-07T00:00:00.000Z',
      reason: 'Maintenance',
    });

    if (blockResult.status === 'success' && blockResult.data) {
      const blockedPeriodId = blockResult.data.id;
      
      // Get blocked periods
      await this.testEndpoint('GET', `/api/availability/blocked-periods?propertyId=${this.propertyId}`);
      
      // Update blocked period
      await this.testEndpoint('PATCH', `/api/availability/blocked-periods/${blockedPeriodId}`, {
        reason: 'Annual maintenance',
      });
      
      // Delete blocked period
      await this.testEndpoint('DELETE', `/api/availability/blocked-periods/${blockedPeriodId}`);
    }

    // Get iCal export URL
    await this.testEndpoint('GET', `/api/availability/ical/export-url/${this.propertyId}`);
    
    // Test public iCal export
    await this.testEndpoint('GET', `/api/availability/ical/export/${this.propertyId}`, {}, false);
  }

  private async testAnalytics() {
    console.log('\n📊 Testing Analytics...');

    // Overview
    await this.testEndpoint('GET', '/api/analytics/overview');
    
    // Revenue analytics
    await this.testEndpoint('GET', '/api/analytics/revenue');
    
    // Occupancy analytics
    await this.testEndpoint('GET', '/api/analytics/occupancy');
    
    // Performance metrics
    await this.testEndpoint('GET', '/api/analytics/performance');
    
    // Export data
    await this.testEndpoint('POST', '/api/analytics/export', {
      type: 'bookings',
      format: 'csv',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-12-31T23:59:59.000Z',
    });
  }

  private async testMessaging() {
    console.log('\n💬 Testing Messaging...');

    if (!this.bookingId) {
      console.log('⚠️  Skipping messaging tests - no booking created');
      return;
    }

    // Send message
    const messageData = {
      bookingId: this.bookingId,
      content: 'Test message from API test',
      type: 'TEXT',
    };

    const messageResult = await this.testEndpoint('POST', '/api/messaging/messages', messageData);
    
    if (messageResult.status === 'success') {
      // Get messages for booking
      await this.testEndpoint('GET', `/api/messaging/bookings/${this.bookingId}/messages`);
      
      // Get all conversations
      await this.testEndpoint('GET', '/api/messaging/conversations');
      
      // Mark as read
      await this.testEndpoint('PUT', `/api/messaging/conversations/${this.bookingId}/read`);
    }

    // Test auto-responses
    await this.testEndpoint('GET', '/api/messaging/auto-response');
    await this.testEndpoint('POST', '/api/messaging/auto-response', {
      name: 'Welcome Message',
      trigger: 'BOOKING_CONFIRMED',
      message: 'Welcome to our villa!',
      isActive: true,
    });
  }

  private async testPayments() {
    console.log('\n💳 Testing Payments...');

    if (!this.bookingId) {
      console.log('⚠️  Skipping payment tests - no booking created');
      return;
    }

    // Create checkout session
    await this.testEndpoint('POST', '/api/payments/checkout/session', {
      bookingId: this.bookingId,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    // Get payment methods
    await this.testEndpoint('GET', '/api/payments/methods');
    
    // Get transactions
    await this.testEndpoint('GET', '/api/payments/transactions');
    
    // Get booking payments
    await this.testEndpoint('GET', `/api/payments/bookings/${this.bookingId}`);
  }

  private async testPublicEndpoints() {
    console.log('\n🌐 Testing Public Endpoints...');

    // Public property search
    await this.testEndpoint('GET', '/api/public/properties', {}, false);
    
    // Public property details
    if (this.propertyId) {
      await this.testEndpoint('GET', `/api/public/properties/${this.propertyId}`, {}, false);
    }
    
    // Public availability check
    await this.testEndpoint('POST', '/api/public/availability/check', {
      propertyId: this.propertyId,
      checkIn: '2025-06-01T00:00:00.000Z',
      checkOut: '2025-06-08T00:00:00.000Z',
    }, false);
    
    // Public pricing calculation
    await this.testEndpoint('POST', '/api/public/pricing/calculate', {
      propertyId: this.propertyId,
      checkIn: '2025-06-01T00:00:00.000Z',
      checkOut: '2025-06-08T00:00:00.000Z',
      guests: 4,
    }, false);
  }

  private async cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    try {
      // Delete test tenant and all related data (cascade)
      if (this.tenantId) {
        await prisma.tenant.delete({
          where: { id: this.tenantId },
        });
        console.log('✅ Test data cleaned up');
      }
    } catch (error) {
      console.error('Failed to cleanup:', error);
    }
  }

  private generateReport() {
    console.log('\n📊 Generating Test Report...\n');

    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.status === 'success').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const successRate = totalTests > 0 ? ((successfulTests / totalTests) * 100).toFixed(2) : '0';

    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Successful: ${successfulTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(60));

    // Group by endpoint category
    const categories: Record<string, TestResult[]> = {
      'Authentication': [],
      'Properties': [],
      'Bookings': [],
      'Pricing': [],
      'Availability': [],
      'Analytics': [],
      'Messaging': [],
      'Payments': [],
      'Public': [],
      'Other': [],
    };

    this.results.forEach(result => {
      if (result.endpoint.includes('/api/auth')) categories['Authentication'].push(result);
      else if (result.endpoint.includes('/api/properties') || result.endpoint.includes('/api/periods')) categories['Properties'].push(result);
      else if (result.endpoint.includes('/api/bookings')) categories['Bookings'].push(result);
      else if (result.endpoint.includes('/api/pricing')) categories['Pricing'].push(result);
      else if (result.endpoint.includes('/api/availability')) categories['Availability'].push(result);
      else if (result.endpoint.includes('/api/analytics')) categories['Analytics'].push(result);
      else if (result.endpoint.includes('/api/messaging')) categories['Messaging'].push(result);
      else if (result.endpoint.includes('/api/payments')) categories['Payments'].push(result);
      else if (result.endpoint.includes('/api/public')) categories['Public'].push(result);
      else categories['Other'].push(result);
    });

    console.log('\nDETAILED RESULTS BY CATEGORY:');
    console.log('-'.repeat(60));

    Object.entries(categories).forEach(([category, results]) => {
      if (results.length > 0) {
        const categorySuccess = results.filter(r => r.status === 'success').length;
        const categoryTotal = results.length;
        console.log(`\n${category}: ${categorySuccess}/${categoryTotal}`);
        
        results.forEach(result => {
          const icon = result.status === 'success' ? '✅' : '❌';
          const statusCode = result.statusCode ? ` [${result.statusCode}]` : '';
          console.log(`  ${icon} ${result.method} ${result.endpoint}${statusCode} (${result.duration}ms)`);
          if (result.error && result.status === 'failed') {
            console.log(`     Error: ${result.error}`);
          }
        });
      }
    });

    // Save detailed report
    const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
    const reportData = {
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        successRate: parseFloat(successRate),
        timestamp: new Date().toISOString(),
      },
      results: this.results,
      categorized: categories,
    };

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Show critical failures
    const criticalFailures = this.results.filter(r => 
      r.status === 'failed' && 
      r.statusCode && 
      r.statusCode >= 500
    );

    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL FAILURES (5xx errors):');
      console.log('-'.repeat(60));
      criticalFailures.forEach(result => {
        console.log(`${result.method} ${result.endpoint} - ${result.statusCode}: ${result.error}`);
      });
    }
  }
}

// Run tests
async function main() {
  const tester = new ComprehensiveEndpointTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);