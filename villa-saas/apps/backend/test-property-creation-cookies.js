const fetch = require('node-fetch');

async function testPropertyCreation() {
  try {
    // First, let's login to get cookies
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

    // Extract cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login successful');
    console.log('Cookies received:', cookies ? 'Yes' : 'No');

    // Extract the access_token cookie value
    let accessToken = null;
    if (cookies) {
      const cookieArray = cookies.split(',').map(c => c.trim());
      const accessTokenCookie = cookieArray.find(c => c.startsWith('access_token='));
      if (accessTokenCookie) {
        accessToken = accessTokenCookie.split(';')[0].split('=')[1];
      }
    }

    if (!accessToken) {
      console.error('No access token found in cookies');
      return;
    }

    console.log('Access token extracted:', accessToken);

    // Now test property creation using the token in Authorization header
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
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': `access_token=${accessToken}` // Also send as cookie
      },
      body: JSON.stringify(propertyData)
    });

    const responseText = await createResponse.text();
    console.log('Response status:', createResponse.status);
    console.log('Response:', responseText);

    if (!createResponse.ok) {
      console.error('Property creation failed');
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error && errorData.error.issues) {
          console.log('Validation errors:');
          errorData.error.issues.forEach(issue => {
            console.log(`- ${issue.path.join('.')}: ${issue.message}`);
          });
        }
      } catch (e) {
        // Not JSON error
      }
    } else {
      console.log('Property created successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testPropertyCreation();