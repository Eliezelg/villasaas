// Script de test pour l'API Analytics

const API_BASE = 'http://localhost:3001/api';

// Fonction pour créer un utilisateur de test
async function createTestUser() {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-analytics@villa-saas.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'Analytics',
        companyName: 'Test Analytics Org'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error creating user:', error);
      return null;
    }

    const data = await response.json();
    console.log('User created successfully');
    return data;
  } catch (error) {
    console.error('Failed to create user:', error);
    return null;
  }
}

// Fonction pour se connecter
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
    // Essayer de créer l'utilisateur si la connexion échoue
    console.log('Login failed, trying to create user...');
    await createTestUser();
    
    // Réessayer la connexion
    const retryResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-analytics@villa-saas.com',
        password: 'Test123!'
      })
    });

    if (!retryResponse.ok) {
      throw new Error('Failed to login after creating user');
    }

    return retryResponse.json();
  }

  return response.json();
}

// Fonction pour tester les endpoints Analytics
async function testAnalytics(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n=== Testing Analytics API ===\n');

  // Test Overview
  console.log('1. Testing /analytics/overview');
  try {
    const overviewResponse = await fetch(`${API_BASE}/analytics/overview`, { headers });
    const overview = await overviewResponse.json();
    console.log('Overview:', JSON.stringify(overview, null, 2));
  } catch (error) {
    console.error('Overview error:', error);
  }

  // Test Occupancy
  console.log('\n2. Testing /analytics/occupancy');
  try {
    const occupancyResponse = await fetch(`${API_BASE}/analytics/occupancy`, { headers });
    const occupancy = await occupancyResponse.json();
    console.log('Occupancy:', JSON.stringify(occupancy, null, 2));
  } catch (error) {
    console.error('Occupancy error:', error);
  }

  // Test Revenue
  console.log('\n3. Testing /analytics/revenue');
  try {
    const revenueResponse = await fetch(`${API_BASE}/analytics/revenue`, { headers });
    const revenue = await revenueResponse.json();
    console.log('Revenue:', JSON.stringify(revenue, null, 2));
  } catch (error) {
    console.error('Revenue error:', error);
  }

  // Test Export
  console.log('\n4. Testing /analytics/export');
  try {
    const exportResponse = await fetch(`${API_BASE}/analytics/export`, { headers });
    if (exportResponse.ok) {
      const csvContent = await exportResponse.text();
      console.log('Export CSV (first 500 chars):\n', csvContent.substring(0, 500));
    } else {
      console.error('Export failed:', await exportResponse.json());
    }
  } catch (error) {
    console.error('Export error:', error);
  }
}

// Main
async function main() {
  try {
    console.log('Logging in...');
    const { accessToken } = await login();
    console.log('Login successful!\n');

    await testAnalytics(accessToken);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();