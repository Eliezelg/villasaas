# 🔒 Audit de Sécurité - Intégration Stripe Villa SaaS

## 📋 Résumé Exécutif

Cette analyse examine la sécurité de l'intégration des paiements Stripe dans Villa SaaS. L'audit couvre l'intégration Stripe Connect, la gestion des clés API, la validation des webhooks, le calcul des montants, la gestion des remboursements, les logs de transactions, la conformité PCI DSS et les vulnérabilités potentielles.

### État Global : ⚠️ **AMÉLIORATION NÉCESSAIRE**

Bien que l'intégration de base soit fonctionnelle, plusieurs améliorations critiques sont nécessaires pour garantir une sécurité optimale.

---

## 🔍 Analyse Détaillée

### 1. ✅ Intégration Stripe Connect et Gestion des Comptes Connectés

**Points Positifs :**
- Le schéma de base de données prévoit les champs nécessaires pour Stripe Connect :
  - `stripeAccountId`
  - `stripeAccountStatus`
  - `stripeDetailsSubmitted`
  - `stripeChargesEnabled`
  - `stripePayoutsEnabled`

**Points d'Amélioration :**
- ⚠️ L'implémentation de Stripe Connect n'est pas encore active (code commenté dans `payments.routes.ts`)
- ⚠️ Absence de routes pour l'onboarding des comptes connectés
- ⚠️ Pas de gestion des commissions et des transferts automatiques

**Recommandations :**
```typescript
// Implémenter l'onboarding Stripe Connect
fastify.post('/api/stripe/connect/onboarding', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const account = await stripe.accounts.create({
    type: 'express',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  // Sauvegarder l'ID du compte et créer le lien d'onboarding
});
```

### 2. ⚠️ Stockage des Clés API Stripe et Tokens

**Points Positifs :**
- Les clés Stripe sont stockées dans les variables d'environnement
- Utilisation correcte de `process.env.STRIPE_SECRET_KEY`
- Plugin Stripe centralisé avec configuration TypeScript stricte

**Points d'Amélioration :**
- ⚠️ Pas de rotation automatique des clés
- ⚠️ Pas de chiffrement supplémentaire pour les tokens sensibles
- ⚠️ Les clés publiques sont exposées via `/api/public/payments/config` sans limitation de rate

**Recommandations :**
```typescript
// Ajouter une rotation des clés et un cache Redis
const STRIPE_CONFIG_CACHE_KEY = 'stripe:public:config';
const CACHE_TTL = 3600; // 1 heure

// Limiter l'accès à la configuration publique
await app.register(rateLimit, {
  max: 10,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
});
```

### 3. ⚠️ Validation des Webhooks Stripe

**Points Critiques :**
- ❌ **VULNÉRABILITÉ MAJEURE** : Le `rawBody` n'est pas correctement configuré
- Le webhook utilise `config: { rawBody: true }` mais Fastify ne préserve pas automatiquement le raw body
- Sans le raw body original, la signature du webhook ne peut pas être vérifiée correctement

**Code Problématique :**
```typescript
// Ligne 196-204 : Configuration incomplète
fastify.post('/public/stripe/webhook', {
  config: {
    rawBody: true, // ⚠️ Ne fonctionne pas sans configuration supplémentaire
  },
```

**Solution Requise :**
```typescript
// Dans app.ts, ajouter avant les routes
app.addContentTypeParser('application/json', { parseAs: 'string' }, 
  function (req, body, done) {
    // Sauvegarder le raw body pour Stripe
    req.rawBody = body;
    try {
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      done(err);
    }
  }
);
```

### 4. ⚠️ Calcul et Validation des Montants

**Points Positifs :**
- Conversion correcte en centimes : `Math.round(amount * 100)`
- Utilisation du service `PricingService` centralisé
- Validation des montants avec Zod (`z.number().positive()`)

**Points d'Amélioration :**
- ⚠️ Pas de double validation côté serveur du montant calculé
- ⚠️ Le montant est fourni par le client dans `createPaymentIntentSchema`
- ⚠️ Risque de manipulation du prix côté client

**Vulnérabilité Identifiée :**
```typescript
// Ligne 44 : Le montant vient directement du client !
const { amount, currency, metadata } = validation.data;

// Ligne 74-76 : Utilisation directe sans recalcul
const paymentIntent = await fastify.stripe.paymentIntents.create({
  amount: Math.round(amount * 100), // ⚠️ Montant non vérifié
```

**Solution Recommandée :**
```typescript
// Recalculer le prix côté serveur
const booking = await fastify.prisma.booking.findFirst({
  where: { 
    id: metadata.bookingId,
    tenantId: tenant.id,
    status: 'PENDING'
  }
});

// Vérifier que le montant correspond
if (Math.abs(booking.total - amount) > 0.01) {
  throw new Error('Amount mismatch');
}
```

### 5. ❌ Gestion des Remboursements et Annulations

**Points Critiques :**
- ❌ **ABSENT** : Aucune route pour les remboursements
- ❌ **ABSENT** : Pas de gestion des remboursements partiels
- ❌ **ABSENT** : Pas de politique de remboursement configurable

**Implémentation Manquante :**
```typescript
// Route nécessaire pour les remboursements
fastify.post('/payments/:bookingId/refund', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  // Vérifier les droits
  // Calculer le montant du remboursement selon la politique
  // Créer le remboursement Stripe
  // Mettre à jour la réservation
  // Créer un log d'audit
});
```

### 6. ✅ Logs de Transactions et Audit Trail

**Points Positifs :**
- Modèle `AuditLog` présent dans le schéma
- Logs créés pour les confirmations de paiement
- Enregistrement de l'IP et des détails

**Points d'Amélioration :**
- ⚠️ Pas de logs pour les tentatives échouées
- ⚠️ Pas de logs pour les webhooks
- ⚠️ Pas de retention policy pour les logs

**Exemple de Log Existant :**
```typescript
// Ligne 171-184 : Bon exemple de log d'audit
await fastify.prisma.auditLog.create({
  data: {
    tenantId,
    userId: request.userId,
    action: 'booking.payment.confirmed',
    entity: 'booking',
    entityId: bookingId,
    details: {
      paymentIntentId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    },
  }
});
```

### 7. ⚠️ Conformité PCI DSS

**Points Positifs :**
- Utilisation de Stripe Elements (PCI DSS Level 1)
- Aucune donnée de carte stockée côté serveur
- Communication HTTPS obligatoire

**Points d'Amélioration :**
- ⚠️ Pas de documentation sur la conformité PCI
- ⚠️ Pas de procédures de sécurité documentées
- ⚠️ Pas de tests de pénétration réguliers

### 8. 🔴 Vulnérabilités de Manipulation de Prix

**Vulnérabilités Identifiées :**

1. **Manipulation du montant** : Le client peut envoyer n'importe quel montant
2. **Absence de vérification** : Pas de validation que le montant correspond au calcul serveur
3. **Metadata non vérifiées** : Les metadata peuvent être manipulées

**Exemple d'Attaque Possible :**
```javascript
// Un attaquant pourrait envoyer :
{
  amount: 1, // 1€ au lieu de 500€
  currency: "EUR",
  metadata: {
    propertyId: "valid-id",
    // ...
  }
}
```

---

## 🛡️ Recommandations Prioritaires

### 1. **CRITIQUE** - Corriger la Validation des Webhooks
```typescript
// Ajouter dans app.ts
app.addContentTypeParser('application/json', { parseAs: 'string' }, 
  function (req, body, done) {
    req.rawBody = body;
    try {
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      done(err);
    }
  }
);

// Déclarer le type
declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string;
  }
}
```

### 2. **CRITIQUE** - Valider les Montants Côté Serveur
```typescript
// Dans createPaymentIntent
const booking = await fastify.prisma.booking.findFirst({
  where: { 
    id: metadata.bookingId,
    status: 'PENDING',
    tenantId: tenant.id
  }
});

if (!booking) {
  throw new Error('Invalid booking');
}

// Utiliser le montant de la réservation, pas celui du client
const paymentIntent = await fastify.stripe.paymentIntents.create({
  amount: Math.round(booking.total * 100),
  currency: booking.currency,
  // ...
});
```

### 3. **IMPORTANT** - Implémenter les Remboursements
```typescript
// Créer un service de remboursement
export class RefundService {
  async processRefund(bookingId: string, amount?: number) {
    // Logique de remboursement avec politique configurable
  }
}
```

### 4. **IMPORTANT** - Ajouter des Tests de Sécurité
```typescript
// Tests pour les paiements
describe('Payment Security', () => {
  it('should reject manipulated amounts', async () => {
    // Test de manipulation de prix
  });
  
  it('should validate webhook signatures', async () => {
    // Test de signature webhook
  });
});
```

### 5. **RECOMMANDÉ** - Monitoring et Alertes
```typescript
// Ajouter des alertes pour :
- Tentatives de paiement échouées répétées
- Montants inhabituels
- Webhooks invalides
- Tentatives de manipulation
```

---

## 📊 Matrice de Risques

| Vulnérabilité | Probabilité | Impact | Priorité |
|---------------|-------------|---------|----------|
| Manipulation de prix | **Élevée** | **Critique** | **P0** |
| Webhook non validé | **Élevée** | **Critique** | **P0** |
| Absence de remboursements | **Moyenne** | **Élevé** | **P1** |
| Pas de rate limiting sur config | **Faible** | **Moyen** | **P2** |
| Logs incomplets | **Moyenne** | **Moyen** | **P2** |

---

## ✅ Plan d'Action

### Phase 1 - Corrections Critiques (1-2 jours)
1. ✅ Corriger la validation des webhooks Stripe
2. ✅ Implémenter la validation côté serveur des montants
3. ✅ Ajouter des logs pour toutes les opérations de paiement

### Phase 2 - Fonctionnalités Manquantes (3-5 jours)
1. ✅ Implémenter le système de remboursement
2. ✅ Ajouter Stripe Connect pour les paiements aux propriétaires
3. ✅ Créer des tests de sécurité

### Phase 3 - Amélioration Continue (1 semaine)
1. ✅ Documentation de conformité PCI DSS
2. ✅ Mise en place du monitoring
3. ✅ Tests de pénétration
4. ✅ Formation de l'équipe

---

## 🔐 Code de Référence Sécurisé

Voici un exemple de route de paiement sécurisée :

```typescript
fastify.post('/public/payments/create-intent', {
  schema: {
    body: z.object({
      bookingId: z.string(),
      // Ne PAS accepter le montant du client
    })
  }
}, async (request, reply) => {
  const { bookingId } = request.body;
  
  // 1. Récupérer et valider la réservation
  const booking = await fastify.prisma.booking.findFirst({
    where: { 
      id: bookingId,
      status: 'PENDING',
      paymentStatus: 'PENDING'
    },
    include: { property: true, tenant: true }
  });
  
  if (!booking) {
    return reply.code(404).send({ error: 'Invalid booking' });
  }
  
  // 2. Vérifier l'expiration (ex: 30 min)
  const bookingAge = Date.now() - booking.createdAt.getTime();
  if (bookingAge > 30 * 60 * 1000) {
    return reply.code(400).send({ error: 'Booking expired' });
  }
  
  // 3. Créer l'intention avec le montant serveur
  const paymentIntent = await fastify.stripe.paymentIntents.create({
    amount: Math.round(booking.total * 100),
    currency: booking.currency,
    metadata: {
      bookingId: booking.id,
      propertyId: booking.propertyId,
      tenantId: booking.tenantId,
      platform: 'villa-saas',
      environment: process.env.NODE_ENV
    },
    // Pour Stripe Connect
    ...(booking.tenant.stripeAccountId && {
      application_fee_amount: Math.round(booking.total * 0.15 * 100),
      transfer_data: {
        destination: booking.tenant.stripeAccountId,
      }
    })
  });
  
  // 4. Mettre à jour la réservation
  await fastify.prisma.booking.update({
    where: { id: booking.id },
    data: { 
      stripePaymentId: paymentIntent.id,
      metadata: {
        ...booking.metadata,
        paymentIntentCreatedAt: new Date().toISOString()
      }
    }
  });
  
  // 5. Log d'audit
  await fastify.prisma.auditLog.create({
    data: {
      tenantId: booking.tenantId,
      action: 'payment.intent.created',
      entity: 'booking',
      entityId: booking.id,
      details: {
        amount: booking.total,
        currency: booking.currency,
        paymentIntentId: paymentIntent.id
      },
      ip: request.ip
    }
  });
  
  return {
    clientSecret: paymentIntent.client_secret,
    amount: booking.total,
    currency: booking.currency
  };
});
```

---

## 📝 Conclusion

L'intégration Stripe de Villa SaaS présente des bases solides mais nécessite des améliorations critiques en matière de sécurité. Les vulnérabilités identifiées, notamment la manipulation possible des prix et la validation incorrecte des webhooks, doivent être corrigées en priorité.

La mise en œuvre des recommandations de ce rapport permettra d'atteindre un niveau de sécurité conforme aux standards de l'industrie et de protéger efficacement les transactions financières de la plateforme.

**Estimation totale : 10-15 jours de développement pour une sécurisation complète**