// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Set test timeout
jest.setTimeout(30000);