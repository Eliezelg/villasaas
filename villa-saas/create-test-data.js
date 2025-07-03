// Script pour créer des données de test

const API_BASE = 'http://localhost:3001/api';

// Login
async function login() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test-analytics@villa-saas.com',
      password: 'Test123!'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to login');
  }

  return response.json();
}

// Create property
async function createProperty(token) {
  const response = await fetch(`${API_BASE}/properties`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Villa Test Analytics',
      description: 'Une belle villa pour les tests',
      propertyType: 'house',
      city: 'Nice',
      postalCode: '06000',
      country: 'FR',
      address: '123 Rue du Test',
      location: {
        latitude: 43.7102,
        longitude: 7.2620
      },
      size: 200,
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 2,
      amenities: ['pool', 'wifi', 'parking', 'airConditioning'],
      rules: ['noSmoking', 'noPets'],
      basePrice: 250,
      cleaningFee: 100,
      touristTax: 2.5,
      status: 'published'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to create property:', error);
    return null;
  }

  return response.json();
}

// Create booking
async function createBooking(token, propertyId) {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7); // 7 days from now
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 5); // 5 nights

  const response = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      propertyId,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      adults: 4,
      children: 2,
      guestFirstName: 'Jean',
      guestLastName: 'Dupont',
      guestEmail: 'jean.dupont@example.com',
      guestPhone: '+33612345678',
      source: 'DIRECT'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to create booking:', error);
    return null;
  }

  return response.json();
}

// Confirm booking
async function confirmBooking(token, bookingId) {
  const response = await fetch(`${API_BASE}/bookings/${bookingId}/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to confirm booking:', error);
    return null;
  }

  return response.json();
}

// Main
async function main() {
  try {
    console.log('1. Logging in...');
    const { accessToken } = await login();
    console.log('✓ Login successful');

    console.log('\n2. Creating property...');
    const property = await createProperty(accessToken);
    if (!property) {
      console.log('Trying to fetch existing properties...');
      // Try to get existing properties
      const response = await fetch(`${API_BASE}/properties`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const properties = await response.json();
      if (properties && properties.length > 0) {
        console.log(`✓ Using existing property: ${properties[0].name}`);
        
        // Create bookings for the first property
        console.log('\n3. Creating bookings...');
        for (let i = 0; i < 3; i++) {
          const booking = await createBooking(accessToken, properties[0].id);
          if (booking) {
            console.log(`✓ Booking ${i + 1} created`);
            const confirmed = await confirmBooking(accessToken, booking.id);
            if (confirmed) {
              console.log(`✓ Booking ${i + 1} confirmed`);
            }
          }
        }
      } else {
        console.log('No properties found. Please create a property first from the dashboard.');
      }
    } else {
      console.log(`✓ Property created: ${property.name}`);
      
      console.log('\n3. Creating bookings...');
      for (let i = 0; i < 3; i++) {
        const booking = await createBooking(accessToken, property.id);
        if (booking) {
          console.log(`✓ Booking ${i + 1} created`);
          const confirmed = await confirmBooking(accessToken, booking.id);
          if (confirmed) {
            console.log(`✓ Booking ${i + 1} confirmed`);
          }
        }
      }
    }

    console.log('\n✅ Test data created successfully!');
    console.log('\nNow you can test the Analytics API with actual data.');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();