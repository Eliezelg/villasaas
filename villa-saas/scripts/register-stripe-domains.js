#!/usr/bin/env node

/**
 * Script pour enregistrer les domaines dans Stripe pour Apple Pay et Google Pay
 * 
 * Usage: node register-stripe-domains.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const domains = [
  'webpro200.com',
  'www.webpro200.com',
  'villasaas-eight.vercel.app',
  'api.webpro200.com'
  // Note: Les wildcards ne sont pas supportés par Stripe
  // Chaque sous-domaine client doit être enregistré individuellement
];

async function registerDomains() {
  console.log('🔄 Enregistrement des domaines dans Stripe...\n');

  for (const domain of domains) {
    try {
      // Vérifier si le domaine existe déjà
      const existingDomains = await stripe.applePayDomains.list();
      const exists = existingDomains.data.some(d => d.domain_name === domain);

      if (exists) {
        console.log(`✅ ${domain} - Déjà enregistré`);
        continue;
      }

      // Enregistrer le nouveau domaine
      const result = await stripe.applePayDomains.create({
        domain_name: domain,
      });

      console.log(`✅ ${domain} - Enregistré avec succès`);
    } catch (error) {
      console.error(`❌ ${domain} - Erreur:`, error.message);
    }
  }

  console.log('\n✨ Enregistrement des domaines terminé!');
}

// Exécuter le script
registerDomains().catch(console.error);