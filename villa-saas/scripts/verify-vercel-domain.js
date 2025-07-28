#!/usr/bin/env node
const fetch = require('node-fetch');

// Configuration
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN || 'XeS9vedL6cGqbncEYrKTtPCm';
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_WDVwHE1tbLl7DsTI4U1i7SZMa62s';
const DOMAIN = 'www.webpro200.com';

async function checkDomain() {
  try {
    console.log('🔍 Vérification du domaine sur Vercel...\n');
    
    // Vérifier si le domaine existe déjà
    const checkUrl = `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${DOMAIN}`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (checkResponse.ok) {
      const data = await checkResponse.json();
      console.log('✅ Le domaine existe déjà sur Vercel');
      console.log(`   Vérifié: ${data.verified ? 'Oui' : 'Non'}`);
      console.log(`   Configuré par: ${data.configuredBy || 'Non configuré'}`);
      
      if (!data.verified) {
        console.log('\n⚠️  Le domaine n\'est pas encore vérifié.');
        console.log('   Assurez-vous que les DNS sont correctement configurés.');
      }
    } else if (checkResponse.status === 404) {
      console.log('❌ Le domaine n\'existe pas sur Vercel');
      console.log('   Ajout du domaine...\n');
      
      // Ajouter le domaine
      const addUrl = `https://api.vercel.com/v10/projects/${PROJECT_ID}/domains`;
      const addResponse = await fetch(addUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: DOMAIN,
          gitBranch: 'main',
        }),
      });

      if (addResponse.ok) {
        console.log('✅ Domaine ajouté avec succès à Vercel !');
        console.log('\n📝 Prochaines étapes :');
        console.log('1. Configurez les enregistrements DNS chez votre registrar');
        console.log('2. Attendez la propagation DNS (5-48h)');
        console.log('3. Le SSL sera automatiquement généré une fois les DNS vérifiés');
      } else {
        const error = await addResponse.json();
        console.error('❌ Erreur lors de l\'ajout du domaine:', error);
      }
    } else {
      const error = await checkResponse.json();
      console.error('❌ Erreur lors de la vérification:', error);
    }

    // Obtenir la configuration DNS recommandée
    console.log('\n📋 Configuration DNS recommandée :');
    console.log('   Type A    : @ → 76.76.21.21');
    console.log('   Type CNAME: www → cname.vercel-dns.com');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkDomain();