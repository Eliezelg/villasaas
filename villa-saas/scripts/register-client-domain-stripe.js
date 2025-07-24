#!/usr/bin/env node

/**
 * Script pour enregistrer un sous-domaine client dans Stripe
 * À appeler lors de la création d'un nouveau domaine client
 * 
 * Usage: node register-client-domain-stripe.js client-name.webpro200.com
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function registerClientDomain(domain) {
  if (!domain) {
    console.error('❌ Erreur: Veuillez fournir un domaine en argument');
    console.log('Usage: node register-client-domain-stripe.js client-name.webpro200.com');
    process.exit(1);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Erreur: STRIPE_SECRET_KEY non définie');
    console.log('Définissez la variable: export STRIPE_SECRET_KEY="sk_..."');
    process.exit(1);
  }

  console.log(`🔄 Enregistrement du domaine ${domain} dans Stripe...`);

  try {
    // Vérifier si le domaine existe déjà
    const existingDomains = await stripe.applePayDomains.list();
    const exists = existingDomains.data.some(d => d.domain_name === domain);

    if (exists) {
      console.log(`✅ ${domain} - Déjà enregistré`);
      return;
    }

    // Enregistrer le nouveau domaine
    const result = await stripe.applePayDomains.create({
      domain_name: domain,
    });

    console.log(`✅ ${domain} - Enregistré avec succès`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Créé le: ${new Date(result.created * 1000).toLocaleString()}`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'enregistrement:`, error.message);
    process.exit(1);
  }
}

// Récupérer le domaine depuis les arguments
const domain = process.argv[2];
registerClientDomain(domain).catch(console.error);