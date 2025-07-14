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

class FinalEndpointTester {
  private apiClient: AxiosInstance;
  private results: TestResult[] = [];
  private tenantId: string = '';
  private tenantSubdomain: string = '';
  private userId: string = '';
  private cookies: string = '';
  private propertyId: string = '';
  private bookingId: string = '';
  private imageId: string = '';
  private periodId: string = '';

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3001',
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async testEndpoint(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    authenticated = true
  ): Promise<TestResult> {
    const startTime = Date.now();
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    // Add cookies for authentication
    if (authenticated && this.cookies) {
      headers['Cookie'] = this.cookies;
    }

    try {
      const response = await this.apiClient.request({
        method,
        url: endpoint,
        data,
        headers,
      });

      // Capture cookies from response
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie'].join('; ');
      }

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
      
      // Log more details for 500 errors
      if (response.status === 500 && response.data) {
        console.log('     Error details:', JSON.stringify(response.data, null, 2));
      }
      
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
    console.log('🚀 Starting final comprehensive API endpoint tests...\n');

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

      // 11. Test additional endpoints
      await this.testAdditionalEndpoints();

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
      this.tenantSubdomain = tenant.subdomain;
      console.log(`✨ Created test tenant: ${this.tenantId} (${this.tenantSubdomain})`);
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

      // Test login with the same credentials
      const loginData = {
        email: registerData.email,
        password: registerData.password,
      };

      const loginResult = await this.testEndpoint('POST', '/api/auth/login', loginData, false);
      
      // The cookies should be set now, test authenticated endpoints
      await this.testEndpoint('GET', '/api/auth/me');
      
      // Test refresh without body since it uses cookies
      await this.testEndpoint('POST', '/api/auth/refresh', {});
      
      // Test logout without body
      await this.testEndpoint('POST', '/api/auth/logout', {});
      
      // Re-login for subsequent tests
      await this.testEndpoint('POST', '/api/auth/login', loginData, false);
    }
  }

  private async testPropertyManagement() {
    console.log('\n🏠 Testing Property Management...');

    // Create property with proper description structure
    const propertyData = {
      name: 'Villa ' + faker.location.street(),
      description: {
        fr: faker.lorem.paragraphs(2),
        en: faker.lorem.paragraphs(2),
      },
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
      cleaningFee: faker.number.int({ min: 50, max: 200 }),
      securityDeposit: faker.number.int({ min: 500, max: 2000 }),
      amenities: {
        wifi: true,
        pool: true,
        parking: true,
        kitchen: true,
        airConditioning: true,
        heating: true,
        washingMachine: true,
      },
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

      // Test property search
      await this.testEndpoint('GET', '/api/properties/search?city=' + propertyData.city);

      // Test property images
      await this.testPropertyImages();

      // Test pricing periods
      await this.testPricingPeriods();
    }
  }

  private async testPropertyImages() {
    console.log('\n📸 Testing Property Images...');

    // Test image upload with base64 format
    // Create a small test image (1x1 pixel transparent PNG)
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const imageData = {
      image: base64Image,
      filename: `test-image-${Date.now()}.png`,
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
      
      // Test set primary
      await this.testEndpoint('PUT', `/api/properties/${this.propertyId}/images/${this.imageId}/primary`, {});
      
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
      basePrice: 500,
      weekendPremium: 50,
      minNights: 7,
      priority: 10,
      isActive: true,
    };

    const createResult = await this.testEndpoint('POST', `/api/periods`, {
      ...periodData,
      propertyId: this.propertyId,
    });

    if (createResult.status === 'success' && createResult.data) {
      this.periodId = createResult.data.id;

      // Get periods for property
      await this.testEndpoint('GET', `/api/periods?propertyId=${this.propertyId}`);
      
      // Get all periods
      await this.testEndpoint('GET', '/api/periods');
      
      // Update period
      await this.testEndpoint('PATCH', `/api/periods/${this.periodId}`, {
        basePrice: 600,
      });
      
      // Delete period
      await this.testEndpoint('DELETE', `/api/periods/${this.periodId}`);
    }
  }

  private async testBookings() {
    console.log('\n📅 Testing Bookings...');

    if (!this.propertyId) {
      console.log('⚠️  Skipping booking tests - no property created');
      return;
    }

    // First ensure we have valid dates
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 30); // 30 days from now
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 7); // 7 days stay

    const guestFullName = faker.person.fullName();
    const [guestFirstName, ...lastNameParts] = guestFullName.split(' ');
    const guestLastName = lastNameParts.join(' ') || 'Test';
    
    const bookingData = {
      propertyId: this.propertyId,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      adults: 2,
      children: 2,
      infants: 0,
      pets: 0,
      guestFirstName,
      guestLastName,
      guestEmail: faker.internet.email(),
      guestPhone: faker.phone.number('+33 6 ## ## ## ##'),
      guestCountry: 'FR',
      source: 'DIRECT',
      specialRequests: 'Test booking from API test',
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
      
      // Get property bookings
      await this.testEndpoint('GET', `/api/properties/${this.propertyId}/bookings`);
    }
  }

  private async testPricing() {
    console.log('\n💵 Testing Pricing Calculation...');

    if (!this.propertyId) {
      console.log('⚠️  Skipping pricing tests - no property created');
      return;
    }

    const pricingData = {
      propertyId: this.propertyId,
      checkIn: '2025-07-15T00:00:00.000Z',
      checkOut: '2025-07-22T00:00:00.000Z',
      guests: 4,
      adults: 2,
      children: 2,
    };

    await this.testEndpoint('POST', '/api/pricing/calculate', pricingData);
    
    // Test pricing with options
    await this.testEndpoint('POST', '/api/bookings/calculate-price', pricingData);
  }

  private async testAvailability() {
    console.log('\n📆 Testing Availability...');

    if (!this.propertyId) {
      console.log('⚠️  Skipping availability tests - no property created');
      return;
    }

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
    
    // Top properties
    await this.testEndpoint('GET', '/api/analytics/top-properties');
    
    // Booking sources
    await this.testEndpoint('GET', '/api/analytics/booking-sources');
  }

  private async testMessaging() {
    console.log('\n💬 Testing Messaging...');

    if (!this.bookingId) {
      console.log('⚠️  Skipping messaging tests - no booking created');
      return;
    }

    // Create conversation
    const conversationData = {
      bookingId: this.bookingId,
      participantIds: [this.userId],
    };

    const conversationResult = await this.testEndpoint('POST', '/api/messaging/conversations', conversationData);
    
    if (conversationResult.status === 'success' && conversationResult.data) {
      const conversationId = conversationResult.data.id;
      
      // Send message
      const messageData = {
        conversationId,
        content: 'Test message from API test',
        type: 'TEXT',
      };

      await this.testEndpoint('POST', '/api/messaging/messages', messageData);
      
      // Get conversation messages
      await this.testEndpoint('GET', `/api/messaging/conversations/${conversationId}/messages`);
      
      // Get all conversations
      await this.testEndpoint('GET', '/api/messaging/conversations');
      
      // Mark as read
      await this.testEndpoint('PUT', `/api/messaging/conversations/${conversationId}/read`);
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

    // Skip payment configuration test - endpoint doesn't exist
    
    // Create payment intent
    await this.testEndpoint('POST', '/api/payments/create-intent', {
      bookingId: this.bookingId,
      amount: 3500,
      currency: 'EUR',
    });
    
    // Get transactions
    await this.testEndpoint('GET', '/api/payments/transactions');
    
    // Get booking payments
    await this.testEndpoint('GET', `/api/bookings/${this.bookingId}/payments`);
  }

  private async testPublicEndpoints() {
    console.log('\n🌐 Testing Public Endpoints...');

    // Public property search - use subdomain
    await this.testEndpoint('GET', `/api/public/properties?tenantId=${this.tenantSubdomain}`, {}, false);
    
    // Public property details
    if (this.propertyId) {
      await this.testEndpoint('GET', `/api/public/properties/${this.propertyId}?tenantId=${this.tenantSubdomain}`, {}, false);
    }
    
    // Public pricing calculation - tenantId should be in query params, not body
    await this.testEndpoint('POST', `/api/public/pricing/calculate?tenantId=${this.tenantSubdomain}`, {
      propertyId: this.propertyId,
      checkIn: '2025-06-01T00:00:00.000Z',
      checkOut: '2025-06-08T00:00:00.000Z',
      guests: 4, // Total guests, not separated by adults/children
    }, false);
  }

  private async testAdditionalEndpoints() {
    console.log('\n🔧 Testing Additional Endpoints...');

    // Test promo codes
    const promoCodeData = {
      code: 'SUMMER2025',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      validFrom: '2025-06-01T00:00:00.000Z',
      validUntil: '2025-08-31T23:59:59.000Z',
      maxUses: 100,
      isActive: true,
    };

    const promoResult = await this.testEndpoint('POST', '/api/promocodes', promoCodeData);
    
    if (promoResult.status === 'success' && promoResult.data) {
      const promoCodeId = promoResult.data.id;
      
      // Get all promo codes
      await this.testEndpoint('GET', '/api/promocodes');
      
      // Validate promo code
      await this.testEndpoint('POST', '/api/public/promocodes/validate', {
        code: 'SUMMER2025',
        propertyId: this.propertyId,
        checkIn: '2025-06-01T00:00:00.000Z',
        checkOut: '2025-06-08T00:00:00.000Z',
        totalAmount: 1000,
        nights: 7,
      }, false);
      
      // Delete promo code
      await this.testEndpoint('DELETE', `/api/promocodes/${promoCodeId}`);
    }

    // Test booking options
    const bookingOptionData = {
      name: {
        fr: 'Petit-déjeuner',
        en: 'Breakfast',
      },
      description: {
        fr: 'Petit-déjeuner continental',
        en: 'Continental breakfast',
      },
      category: 'CATERING',
      pricePerUnit: 15,
      pricingType: 'PER_PERSON',
      pricingPeriod: 'PER_NIGHT',
      isActive: true,
    };

    await this.testEndpoint('POST', '/api/booking-options', bookingOptionData);
    const optionsResult = await this.testEndpoint('GET', '/api/booking-options?propertyId=' + this.propertyId);
      
    if (optionsResult.status === 'success' && optionsResult.data && optionsResult.data.length > 0) {
      const optionId = optionsResult.data[0].id;
      // Update option
      await this.testEndpoint('PATCH', `/api/booking-options/${optionId}`, {
        pricePerUnit: 20,
      });
      
      // Delete option
      await this.testEndpoint('DELETE', `/api/booking-options/${optionId}`);
    }

    // Test health endpoints
    await this.testEndpoint('GET', '/health', {}, false);
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
    console.log('\n📊 Generating Final Test Report...\n');

    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.status === 'success').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const successRate = totalTests > 0 ? ((successfulTests / totalTests) * 100).toFixed(2) : '0';

    console.log('='.repeat(60));
    console.log('FINAL TEST SUMMARY');
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
      'PromoCode': [],
      'BookingOptions': [],
      'Health': [],
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
      else if (result.endpoint.includes('/promo-code')) categories['PromoCode'].push(result);
      else if (result.endpoint.includes('/booking-option')) categories['BookingOptions'].push(result);
      else if (result.endpoint.includes('/health')) categories['Health'].push(result);
      else categories['Other'].push(result);
    });

    console.log('\nDETAILED RESULTS BY CATEGORY:');
    console.log('-'.repeat(60));

    Object.entries(categories).forEach(([category, results]) => {
      if (results.length > 0) {
        const categorySuccess = results.filter(r => r.status === 'success').length;
        const categoryTotal = results.length;
        const categoryRate = ((categorySuccess / categoryTotal) * 100).toFixed(0);
        console.log(`\n${category}: ${categorySuccess}/${categoryTotal} (${categoryRate}%)`);
        
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
    const reportPath = path.join(__dirname, `final-test-report-${Date.now()}.json`);
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

    // Show success summary
    if (successRate === '100') {
      console.log('\n🎉 PERFECT! All tests passed!');
    } else if (parseFloat(successRate) >= 90) {
      console.log('\n✨ EXCELLENT! Most tests passed.');
    } else if (parseFloat(successRate) >= 70) {
      console.log('\n👍 GOOD! Majority of tests passed.');
    } else {
      console.log('\n⚠️  NEEDS ATTENTION! Many tests failed.');
    }
  }
}

// Run tests
async function main() {
  const tester = new FinalEndpointTester();
  
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