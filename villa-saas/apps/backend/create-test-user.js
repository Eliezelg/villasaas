const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // First, create a tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Company',
        email: 'test@example.com',
        phone: '+33123456789',
        companyName: 'Test Company Ltd',
      }
    });

    console.log('Tenant created:', tenant.id);

    // Then create a user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        tenantId: tenant.id,
      }
    });

    console.log('User created:', user.email);
    console.log('You can now test with:');
    console.log('Email:', user.email);
    console.log('Password: password123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();