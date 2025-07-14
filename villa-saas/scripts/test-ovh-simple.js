const ovh = require('ovh')({
  endpoint: 'ovh-eu',
  appKey: 'a943dcbceaca25af',
  appSecret: '06319ddf0a68eff06facd09df77a4408',
  consumerKey: '8f88326ed464aadd8af2b7e2e7f19994'
});

console.log('🔧 Test de connexion OVH...\n');

// Test 1: Récupérer les infos du compte
ovh.request('GET', '/me', function (err, me) {
  if (err) {
    console.error('❌ Erreur de connexion:', err);
    console.error('   Code:', err.error || err.statusCode);
    console.error('   Message:', err.message);
    if (err.error === 403) {
      console.error('\n⚠️  Erreur 403: Les clés API sont invalides ou les permissions sont insuffisantes');
      console.error('   Vérifiez que:');
      console.error('   1. Les clés sont correctes');
      console.error('   2. Le Consumer Key a été validé');
      console.error('   3. Les permissions incluent /me et /domain/*');
    }
    return;
  }
  
  console.log('✅ Connexion réussie !');
  console.log('   Compte:', me.firstname, me.name);
  console.log('   Email:', me.email);
  console.log('   Customer ID:', me.customerCode);
  console.log('');
  
  // Test 2: Lister les domaines
  ovh.request('GET', '/domain', function (err, domains) {
    if (err) {
      console.error('❌ Erreur lors de la récupération des domaines:', err);
      return;
    }
    
    console.log('📋 Domaines existants:', domains.length);
    if (domains.length > 0) {
      console.log('   -', domains.join('\n   - '));
    }
    console.log('');
    
    // Test 3: Vérifier un domaine disponible
    const testDomain = 'test-villa-' + Date.now() + '.com';
    console.log('🔍 Test de disponibilité pour:', testDomain);
    
    // D'abord créer un cart
    ovh.request('POST', '/order/cart', {
      ovhSubsidiary: 'FR'
    }, function(err, cart) {
      if (err) {
        console.error('❌ Erreur lors de la création du cart:', err);
        return;
      }
      
      console.log('✅ Cart créé:', cart.cartId);
      
      // Essayer d'ajouter le domaine
      ovh.request('POST', '/order/cart/' + cart.cartId + '/domain', {
        domain: testDomain,
        duration: 'P1Y'
      }, function(err, item) {
        if (err) {
          if (err.message && err.message.includes('not available')) {
            console.log('❌ Domaine non disponible');
          } else {
            console.error('❌ Erreur:', err);
          }
        } else {
          console.log('✅ Domaine disponible !');
          
          // Récupérer le prix
          ovh.request('GET', '/order/cart/' + cart.cartId, function(err, cartInfo) {
            if (!err && cartInfo.items) {
              const domainItem = cartInfo.items.find(i => i.settings && i.settings.domain === testDomain);
              if (domainItem && domainItem.prices) {
                const price = domainItem.prices[0].price.value;
                console.log('   Prix:', price + '€/an');
              }
            }
            
            // Nettoyer le cart
            ovh.request('DELETE', '/order/cart/' + cart.cartId, function() {
              console.log('✅ Cart nettoyé');
              console.log('\n🎉 Tous les tests sont passés !');
            });
          });
        }
      });
    });
  });
});