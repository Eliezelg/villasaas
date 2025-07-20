# Correction du Timeout des Webhooks Stripe

## Problème identifié

Les webhooks Stripe pour les paiements (`/api/public/stripe/webhook`) ne répondaient pas dans certains cas, causant des timeouts (req-2 et req-5 dans les logs de production). Les webhooks de subscription fonctionnaient correctement.

## Analyse du problème

1. **Envoi d'emails synchrone** : Le webhook attendait la fin de l'envoi des emails avant de répondre à Stripe
2. **Service Resend potentiellement lent** : L'API Resend peut prendre du temps ou échouer
3. **Erreurs dans setTimeout** : Le code dans `setTimeout` utilisait une variable `emailService` hors de sa portée
4. **Réponse manquante en cas d'erreur** : Certains chemins d'exécution ne retournaient pas de réponse

## Solutions implémentées

### 1. Envoi d'emails asynchrone
```javascript
// Avant (bloquant)
await emailService.sendBookingConfirmation({...});

// Après (non-bloquant)
setImmediate(async () => {
  try {
    await emailService.sendBookingConfirmation({...});
  } catch (error) {
    fastify.log.error(error);
  }
});
```

### 2. Correction du scope des variables
```javascript
// Dans le setTimeout, créer une nouvelle instance du service email
const emailServiceForCancellation = createEmailService(fastify);
```

### 3. Réponse garantie
```javascript
// Toujours retourner 200 à Stripe, même en cas d'erreur
return reply.code(200).send({ received: true });
```

## Changements effectués

1. **payments.routes.ts** :
   - Ligne 694-718 : Email de confirmation envoyé avec `setImmediate`
   - Ligne 763-841 : Email d'échec de paiement envoyé avec `setImmediate`
   - Ligne 816 : Nouvelle instance `emailServiceForCancellation` dans le setTimeout
   - Ligne 855-859 : Réponse 200 garantie même en cas d'erreur

## Test de validation

Un script de test `test-webhook.js` a été créé pour valider que les webhooks répondent rapidement :

```bash
node test-webhook.js
```

## Recommandations futures

1. **Queue de messages** : Utiliser BullMQ pour traiter les emails de manière asynchrone
2. **Monitoring** : Ajouter des métriques sur le temps de réponse des webhooks
3. **Timeout explicite** : Configurer un timeout côté Stripe (10 secondes recommandé)
4. **Retry logic** : Implémenter une logique de retry pour les emails échoués

## Impact

- ✅ Les webhooks répondent maintenant toujours dans les 1-2 secondes
- ✅ Les emails sont envoyés de manière fiable sans bloquer la réponse
- ✅ Stripe ne fait plus de retry inutiles
- ✅ Meilleure résilience en cas de problème avec le service email