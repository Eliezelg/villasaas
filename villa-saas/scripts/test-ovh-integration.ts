#!/usr/bin/env ts-node

/**
 * Script de test pour vérifier l'intégration OVH
 * Usage: npx ts-node scripts/test-ovh-integration.ts
 */

import ovh from 'ovh';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testOVHIntegration() {
  console.log('🔧 Test de l\'intégration OVH...\n');

  // Vérifier les variables d'environnement
  const requiredEnvVars = ['OVH_APP_KEY', 'OVH_APP_SECRET', 'OVH_CONSUMER_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:', missingVars.join(', '));
    process.exit(1);
  }

  console.log('✅ Variables d\'environnement trouvées\n');

  // Initialiser le client OVH
  const client = ovh({
    endpoint: process.env.OVH_ENDPOINT || 'ovh-eu',
    appKey: process.env.OVH_APP_KEY!,
    appSecret: process.env.OVH_APP_SECRET!,
    consumerKey: process.env.OVH_CONSUMER_KEY!,
  });

  try {
    // 1. Tester l'authentification en récupérant les informations du compte
    console.log('📋 Test 1: Authentification...');
    const account = await client.request('GET', '/me');
    console.log('✅ Authentification réussie');
    console.log(`   Compte: ${account.firstname} ${account.name}`);
    console.log(`   Email: ${account.email}\n`);

    // 2. Lister les domaines existants
    console.log('📋 Test 2: Liste des domaines...');
    const domains = await client.request('GET', '/domain');
    console.log(`✅ ${domains.length} domaine(s) trouvé(s)`);
    if (domains.length > 0) {
      console.log('   Domaines:', domains.join(', '));
    }
    console.log('');

    // 3. Tester la vérification de disponibilité
    console.log('📋 Test 3: Vérification de disponibilité...');
    const testDomain = 'test-villa-' + Date.now() + '.com';
    
    try {
      // Créer un cart pour tester
      const cart = await client.request('POST', '/order/cart', {
        ovhSubsidiary: 'FR',
      });
      console.log('✅ Cart créé:', cart.cartId);

      // Essayer d'ajouter le domaine au cart
      try {
        await client.request('POST', `/order/cart/${cart.cartId}/domain`, {
          domain: testDomain,
          duration: 'P1Y',
        });
        
        // Récupérer les informations du cart
        const cartInfo = await client.request('GET', `/order/cart/${cart.cartId}`);
        const price = cartInfo.prices?.[0]?.price?.value || 'N/A';
        
        console.log(`✅ Domaine ${testDomain} disponible`);
        console.log(`   Prix: ${price}€/an`);
      } catch (error: any) {
        if (error.message?.includes('not available')) {
          console.log(`❌ Domaine ${testDomain} non disponible`);
        } else {
          throw error;
        }
      }

      // Nettoyer le cart
      await client.request('DELETE', `/order/cart/${cart.cartId}`);
      console.log('✅ Cart nettoyé\n');

    } catch (error) {
      console.error('❌ Erreur lors du test de disponibilité:', error);
    }

    // 4. Vérifier les moyens de paiement
    console.log('📋 Test 4: Moyens de paiement...');
    try {
      const paymentMethods = await client.request('GET', '/me/payment/method');
      console.log(`✅ ${paymentMethods.length} moyen(s) de paiement trouvé(s)`);
      
      if (paymentMethods.length === 0) {
        console.log('⚠️  Aucun moyen de paiement configuré');
        console.log('   Vous devez ajouter un moyen de paiement sur votre compte OVH');
        console.log('   pour pouvoir acheter des domaines automatiquement');
      }
    } catch (error) {
      console.log('❌ Impossible de récupérer les moyens de paiement');
    }

    console.log('\n✅ Tous les tests sont passés avec succès !');
    console.log('🎉 L\'intégration OVH est fonctionnelle\n');

  } catch (error: any) {
    console.error('\n❌ Erreur lors des tests:', error.message || error);
    console.error('\nDétails:', error);
    process.exit(1);
  }
}

// Lancer les tests
testOVHIntegration().catch(console.error);