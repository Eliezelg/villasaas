// Test script for availability calendar route

const testAvailabilityRoute = async () => {
  try {
    // Test with missing parameters
    console.log('Test 1: Missing parameters');
    const response1 = await fetch('http://localhost:3001/api/availability/availability-calendar', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    console.log('Status:', response1.status);
    console.log('Response:', await response1.json());
    console.log('\n---\n');

    // Test with invalid dates
    console.log('Test 2: Invalid dates');
    const response2 = await fetch('http://localhost:3001/api/availability/availability-calendar?propertyId=test123&startDate=invalid&endDate=invalid', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    console.log('Status:', response2.status);
    console.log('Response:', await response2.json());
    console.log('\n---\n');

    // Test with valid parameters
    console.log('Test 3: Valid parameters');
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const response3 = await fetch(`http://localhost:3001/api/availability/availability-calendar?propertyId=YOUR_PROPERTY_ID&startDate=${today.toISOString().split('T')[0]}&endDate=${nextMonth.toISOString().split('T')[0]}`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    console.log('Status:', response3.status);
    console.log('Response:', await response3.json());

  } catch (error) {
    console.error('Error:', error);
  }
};

console.log('Availability Calendar Route Test');
console.log('================================');
console.log('Replace YOUR_TOKEN_HERE with a valid JWT token');
console.log('Replace YOUR_PROPERTY_ID with a valid property ID');
console.log('Then run: node test-availability-route.js');
console.log('================================\n');

// Uncomment to run:
// testAvailabilityRoute();