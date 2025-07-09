const fetch = require('node-fetch');

async function testPropertyCreation() {
  try {
    // First, let's login to get a valid token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.accessToken;
    console.log('Login successful, token received:', token ? 'Yes' : 'No');
    console.log('Login response:', loginData);

    // Now test property creation
    const propertyData = {
      name: 'Test Villa Creation',
      description: { fr: 'Villa de test', en: 'Test villa' },
      propertyType: 'VILLA',
      status: 'PUBLISHED',
      address: '123 Test Street',
      city: 'Test City',
      country: 'France',
      postalCode: '12345',
      latitude: 45.0,
      longitude: 1.0,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      surfaceArea: 150,
      basePrice: 200,
      cleaningFee: 50,
      securityDeposit: 500,
      amenities: { wifi: true, pool: true },
      features: { modern: true, luxury: true }
    };

    const createResponse = await fetch('http://localhost:3001/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(propertyData)
    });

    const responseText = await createResponse.text();
    console.log('Response status:', createResponse.status);
    console.log('Response:', responseText);

    if (!createResponse.ok) {
      console.error('Property creation failed');
    } else {
      console.log('Property created successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testPropertyCreation();