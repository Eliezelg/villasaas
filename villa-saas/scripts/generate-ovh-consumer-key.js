const https = require('https');

console.log('🔑 Génération d\'un nouveau Consumer Key OVH...\n');

const appKey = 'a943dcbceaca25af';
const appSecret = '06319ddf0a68eff06facd09df77a4408';

const data = JSON.stringify({
  accessRules: [
    { method: 'GET', path: '/me' },
    { method: 'GET', path: '/me/*' },
    { method: 'GET', path: '/domain' },
    { method: 'GET', path: '/domain/*' },
    { method: 'POST', path: '/domain/*' },
    { method: 'PUT', path: '/domain/*' },
    { method: 'DELETE', path: '/domain/*' },
    { method: 'GET', path: '/order/*' },
    { method: 'POST', path: '/order/*' },
    { method: 'PUT', path: '/order/*' },
    { method: 'DELETE', path: '/order/*' }
  ],
  redirection: null
});

const options = {
  hostname: 'eu.api.ovh.com',
  port: 443,
  path: '/1.0/auth/credential',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Ovh-Application': appKey,
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('✅ Consumer Key généré avec succès !\n');
      console.log('📋 Informations :');
      console.log('   Consumer Key:', result.consumerKey);
      console.log('   État:', result.state);
      console.log('\n🌐 URL de validation :');
      console.log('   ' + result.validationUrl);
      console.log('\n⚠️  IMPORTANT :');
      console.log('   1. Ouvrez l\'URL ci-dessus dans votre navigateur');
      console.log('   2. Connectez-vous avec votre compte OVH');
      console.log('   3. Autorisez l\'application');
      console.log('   4. Mettez à jour la variable OVH_CONSUMER_KEY dans .env.local');
      console.log('\n   OVH_CONSUMER_KEY=' + result.consumerKey);
    } catch (e) {
      console.error('❌ Erreur lors du parsing de la réponse:', e);
      console.error('Réponse brute:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erreur de connexion:', e);
});

req.write(data);
req.end();