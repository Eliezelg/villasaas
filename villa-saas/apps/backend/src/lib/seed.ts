import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@villa-saas/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Créer un tenant de démonstration
  const demoTenant = await prisma.tenant.create({
    data: {
      name: 'Demo Villa',
      email: 'demo@villa-saas.com',
      companyName: 'Demo Villa Company',
      phone: '+33612345678',
      subdomain: 'demo',
      settings: {
        currency: 'EUR',
        timezone: 'Europe/Paris',
        language: 'fr',
      },
    },
  });

  console.log('✅ Created demo tenant:', demoTenant.subdomain);

  // Créer un utilisateur owner
  const ownerPassword = await hashPassword('Demo1234!');
  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.villa-saas.com',
      passwordHash: ownerPassword,
      firstName: 'Jean',
      lastName: 'Propriétaire',
      role: 'OWNER',
      emailVerified: true,
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created owner user:', owner.email);

  // Créer un utilisateur admin
  const adminPassword = await hashPassword('Admin1234!');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.villa-saas.com',
      passwordHash: adminPassword,
      firstName: 'Marie',
      lastName: 'Admin',
      role: 'ADMIN',
      emailVerified: true,
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Créer des propriétés de démonstration
  const properties = [
    {
      name: 'Villa Belle Vue',
      slug: 'villa-belle-vue',
      propertyType: 'VILLA' as const,
      status: 'PUBLISHED' as const,
      address: '123 Chemin des Oliviers',
      city: 'Nice',
      postalCode: '06000',
      country: 'FR',
      latitude: 43.7102,
      longitude: 7.2620,
      bedrooms: 4,
      bathrooms: 3,
      maxGuests: 8,
      surfaceArea: 180,
      description: {
        fr: 'Magnifique villa avec vue panoramique sur la mer. Piscine privée, jardin arboré et proche de toutes commodités.',
        en: 'Beautiful villa with panoramic sea view. Private pool, landscaped garden and close to all amenities.',
      },
      basePrice: 250,
      weekendPremium: 50,
      cleaningFee: 150,
      securityDeposit: 1000,
      minNights: 3,
      amenities: {
        wifi: true,
        pool: true,
        parking: true,
        airConditioning: true,
        kitchen: true,
        washingMachine: true,
        dishwasher: true,
        tv: true,
        bbq: true,
        garden: true,
      },
      atmosphere: {
        romantic: 0.8,
        family: 0.9,
        luxury: 0.9,
        calm: 0.9,
      },
      proximity: {
        beach: 800,
        shops: 500,
        restaurant: 300,
        airport: 15000,
      },
    },
    {
      name: 'Appartement Centre Ville',
      slug: 'appartement-centre-ville',
      propertyType: 'APARTMENT' as const,
      status: 'PUBLISHED' as const,
      address: '45 Rue de la République',
      city: 'Cannes',
      postalCode: '06400',
      country: 'FR',
      latitude: 43.5528,
      longitude: 7.0174,
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      surfaceArea: 65,
      description: {
        fr: 'Appartement moderne en plein cœur de Cannes, à 5 minutes à pied de la Croisette.',
        en: 'Modern apartment in the heart of Cannes, 5 minutes walk from the Croisette.',
      },
      basePrice: 120,
      weekendPremium: 20,
      cleaningFee: 60,
      securityDeposit: 500,
      minNights: 2,
      amenities: {
        wifi: true,
        airConditioning: true,
        kitchen: true,
        washingMachine: true,
        tv: true,
        elevator: true,
      },
      atmosphere: {
        romantic: 0.7,
        business: 0.8,
        shopping: 0.9,
        nightlife: 0.8,
      },
      proximity: {
        beach: 300,
        shops: 50,
        restaurant: 100,
        trainStation: 500,
      },
    },
  ];

  for (const propertyData of properties) {
    const property = await prisma.property.create({
      data: {
        ...propertyData,
        tenantId: demoTenant.id,
      },
    });
    console.log(`✅ Created property: ${property.name}`);
  }

  // Créer des périodes tarifaires
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const summerPeriod = await prisma.period.create({
    data: {
      name: 'Haute saison été 2024',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-08-31'),
      priority: 10,
      basePrice: 350,
      weekendPremium: 75,
      minNights: 7,
      isGlobal: true,
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created pricing period:', summerPeriod.name);

  // Créer une taxe de séjour
  const touristTax = await prisma.touristTax.create({
    data: {
      name: 'Taxe de séjour Nice',
      enabled: true,
      calculationType: 'FIXED_PER_PERSON_PER_NIGHT',
      amount: 2.5,
      exemptions: {
        minAge: 18,
        maxNights: null,
      },
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created tourist tax:', touristTax.name);

  // Créer des templates d'email
  const emailTemplates = [
    {
      type: 'BOOKING_CONFIRMATION' as const,
      name: 'Confirmation de réservation',
      subject: {
        fr: 'Votre réservation est confirmée - {{property.name}}',
        en: 'Your booking is confirmed - {{property.name}}',
      },
      content: {
        fr: '<p>Bonjour {{guest.firstName}},</p><p>Votre réservation pour {{property.name}} est confirmée.</p>',
        en: '<p>Hello {{guest.firstName}},</p><p>Your booking for {{property.name}} is confirmed.</p>',
      },
      variables: ['guest.firstName', 'guest.lastName', 'property.name', 'booking.checkIn', 'booking.checkOut'],
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.create({
      data: {
        ...template,
        isActive: true,
        tenantId: demoTenant.id,
      },
    });
  }

  console.log('✅ Created email templates');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('Owner: owner@demo.villa-saas.com / Demo1234!');
  console.log('Admin: admin@demo.villa-saas.com / Admin1234!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });