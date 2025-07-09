// Script de test pour Cloudflare R2
const { S3Client, PutObjectCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '../apps/backend/.env.production' });

async function testR2() {
  console.log('🧪 Test de connexion Cloudflare R2...\n');

  // Configuration
  const config = {
    region: 'auto',
    endpoint: process.env.AWS_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };

  console.log('📋 Configuration:');
  console.log(`- Endpoint: ${config.endpoint}`);
  console.log(`- Bucket: ${process.env.AWS_S3_BUCKET}`);
  console.log(`- Access Key: ${config.credentials.accessKeyId?.substring(0, 10)}...`);

  const s3 = new S3Client(config);

  try {
    // Test 1: Lister les buckets
    console.log('\n1️⃣ Test de connexion...');
    const buckets = await s3.send(new ListBucketsCommand({}));
    console.log('✅ Connexion réussie!');
    console.log(`   Buckets trouvés: ${buckets.Buckets?.length || 0}`);

    // Test 2: Upload d'un fichier test
    console.log('\n2️⃣ Test d\'upload...');
    const testKey = `test/test-${Date.now()}.txt`;
    const testContent = `Test Cloudflare R2 - ${new Date().toISOString()}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    }));
    
    console.log('✅ Upload réussi!');
    console.log(`   Clé: ${testKey}`);
    
    // URL publique
    const publicUrl = `https://pub-91f5cb17497718e160ddd2020c86b751.r2.dev/${testKey}`;
    console.log(`   URL: ${publicUrl}`);

    console.log('\n✅ Tous les tests sont passés!');
    console.log('🚀 Cloudflare R2 est prêt à être utilisé.');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error('Détails:', error);
  }
}

testR2();