// Test rapide pour vérifier que le serveur démarre
const http = require('http');

console.log('⏳ Attente du démarrage du serveur...');
setTimeout(() => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Serveur actif !');
      console.log('📊 Health check:', data);
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  });

  req.end();
}, 3000);