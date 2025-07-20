# Configuration des Webhooks Stripe

## Problème identifié

Les webhooks Stripe retournent des erreurs de vérification de signature en production. Les deux problèmes identifiés sont:

1. **Erreur d'authentification**: Le code essayait de créer des logs d'audit avec `tenantId: 'system'` qui n'existe pas dans la base de données.
2. **Erreur de signature Stripe**: Le webhook de subscription n'avait pas le bon code pour capturer le raw body.

## Corrections appliquées

### 1. Logs d'audit système
- Remplacé les `auditLog.create()` avec `tenantId: 'system'` par des logs simples via `fastify.log.warn()`
- Cela évite l'erreur de contrainte de clé étrangère

### 2. Webhook de subscription
- Ajouté le `preValidation` hook pour capturer correctement le raw body
- Corrigé l'utilisation du raw body dans `constructEvent()`

## Configuration en production

### Étapes pour configurer les webhooks Stripe:

1. **Connectez-vous au dashboard Stripe**
   - Allez dans "Developers" > "Webhooks"

2. **Créez deux endpoints webhook séparés**:
   
   **Webhook de paiement**:
   - URL: `https://villasaas-production.up.railway.app/api/public/stripe/webhook`
   - Événements à écouter:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.succeeded`
     - `charge.failed`

   **Webhook de subscription**:
   - URL: `https://villasaas-production.up.railway.app/api/public/stripe/subscription-webhook`
   - Événements à écouter:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `setup_intent.succeeded`

3. **Récupérez les secrets des webhooks**
   - Chaque webhook aura son propre secret commençant par `whsec_`
   - Ne PAS utiliser le même secret pour les deux webhooks

4. **Mettez à jour les variables d'environnement**:
   ```bash
   STRIPE_WEBHOOK_SECRET="whsec_[secret-du-webhook-paiement]"
   STRIPE_SUBSCRIPTION_WEBHOOK_SECRET="whsec_[secret-du-webhook-subscription]"
   ```

5. **Vérifiez la configuration sur Railway**:
   - Dans Railway, allez dans les variables d'environnement
   - Assurez-vous que les deux secrets sont différents et correspondent aux webhooks créés

## Test des webhooks

### En local avec Stripe CLI:
```bash
# Pour tester les deux webhooks
stripe listen --forward-to localhost:5000/api/public/stripe/webhook
stripe listen --forward-to localhost:5000/api/public/stripe/subscription-webhook

# Déclencher des événements de test
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

### En production:
- Utilisez l'onglet "Test" dans le dashboard Stripe pour envoyer des événements de test
- Vérifiez les logs dans Railway pour voir si les webhooks sont correctement traités

## Dépannage

Si les erreurs de signature persistent:

1. **Vérifiez que les secrets sont corrects**:
   - Les secrets doivent commencer par `whsec_`
   - Ils doivent correspondre exactement aux webhooks créés dans Stripe

2. **Vérifiez les headers**:
   - L'header `stripe-signature` doit être présent
   - Le raw body doit être capturé avant tout parsing JSON

3. **Vérifiez les logs**:
   - `fastify.log.error('Webhook signature verification failed:', err)` donnera plus de détails
   - Vérifiez que le raw body est bien une chaîne et non un Buffer

4. **Configuration du proxy**:
   - Si vous utilisez un proxy ou load balancer, assurez-vous qu'il ne modifie pas le body de la requête
   - Le raw body doit être transmis tel quel sans modification

## Code de référence

Les deux webhooks doivent avoir cette structure:

```typescript
fastify.post('/public/stripe/webhook-endpoint', {
  config: {
    rawBody: true,
  },
  preValidation: async (request) => {
    // Capturer le raw body pour la validation de signature
    const chunks: Buffer[] = [];
    request.raw.on('data', (chunk) => chunks.push(chunk));
    await new Promise((resolve) => {
      request.raw.on('end', () => {
        (request as any).rawBody = Buffer.concat(chunks).toString('utf8');
        resolve(true);
      });
    });
  },
}, async (request, reply) => {
  const sig = request.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = fastify.stripe.webhooks.constructEvent(
      (request as any).rawBody as string,
      sig,
      webhookSecret
    );
    // Traiter l'événement...
  } catch (err) {
    fastify.log.error('Webhook signature verification failed:', err);
    return reply.code(400).send({ error: 'Invalid signature' });
  }
});
```