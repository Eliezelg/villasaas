# Plan de Migration Stripe vers Adyen

## 📋 Vue d'ensemble

Ce document détaille le plan complet pour migrer l'infrastructure de paiement de Villa SaaS de Stripe vers Adyen. La migration sera effectuée en plusieurs phases pour minimiser les risques et assurer la continuité du service.

## 🎯 Objectifs de la Migration

1. **Réduction des coûts** : Adyen offre des tarifs plus compétitifs pour les volumes élevés
2. **Meilleure couverture géographique** : Support natif de plus de moyens de paiement locaux
3. **Plateforme unifiée** : Paiements, marketplace et terminaux dans une seule solution
4. **Conformité PSD2** : Meilleure gestion de l'authentification forte (SCA)
5. **Support technique local** : Équipe de support en Europe

## 📊 Analyse de l'implémentation actuelle

### Points d'intégration Stripe identifiés

1. **Configuration** :
   - Plugin Fastify (`/plugins/stripe.ts`)
   - Variables d'environnement (4 clés Stripe)
   - Configuration publique côté client

2. **API Endpoints** :
   - Création d'intention de paiement
   - Configuration publique
   - Webhooks
   - Confirmation de paiement
   - Liste des paiements

3. **Modèles de données** :
   - Champs Stripe dans Tenant, Booking, Payment
   - PaymentConfiguration pour les paramètres

4. **Frontend** :
   - Stripe Elements pour le formulaire de paiement
   - StripeWrapper pour le contexte
   - Pages de réservation et confirmation

5. **Sécurité** :
   - Validation des montants à améliorer
   - Gestion des webhooks
   - Rate limiting à implémenter

## 🔄 Mapping Stripe → Adyen

### 1. Concepts équivalents

| Stripe | Adyen | Notes |
|--------|-------|-------|
| PaymentIntent | Payment Session | Intention de paiement côté serveur |
| PaymentElement | Drop-in/Components | UI de paiement côté client |
| Customer | Shopper Reference | Identification client pour paiements récurrents |
| Connect Account | Marketplace Split | Gestion des sous-marchands |
| Webhook | Notification | Événements asynchrones |
| Test/Live mode | Test/Live endpoints | Environnements séparés |

### 2. APIs équivalentes

| Fonctionnalité | Stripe API | Adyen API |
|----------------|------------|-----------|
| Créer paiement | `stripe.paymentIntents.create()` | `checkout.sessions()` |
| Confirmer paiement | `stripe.paymentIntents.confirm()` | Automatique via Drop-in |
| Webhooks | Event handlers | Notification handlers |
| Remboursements | `stripe.refunds.create()` | `payments.refund()` |
| Liste paiements | `stripe.paymentIntents.list()` | `payments.list()` |

### 3. Configuration équivalente

```env
# Stripe (actuel)
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CONNECT_CLIENT_ID

# Adyen (nouveau)
ADYEN_API_KEY
ADYEN_CLIENT_KEY
ADYEN_MERCHANT_ACCOUNT
ADYEN_HMAC_KEY
ADYEN_LIVE_ENDPOINT_PREFIX
```

## 📝 Plan de Migration Simplifié (Pas encore en production)

### Phase 1 : Configuration Adyen (3-5 jours)

#### 1.1 Setup initial
- [ ] Créer compte Adyen et obtenir les credentials
- [ ] Configurer le merchant account pour Israël et Europe
- [ ] Activer toutes les méthodes de paiement nécessaires
- [ ] Configurer les webhooks Adyen
- [ ] Setup environnement de test

### Phase 2 : Remplacement Direct de Stripe (1 semaine)

#### 2.1 Suppression code Stripe et ajout Adyen
- [ ] Supprimer `/plugins/stripe.ts`
- [ ] Créer `/plugins/adyen.ts` avec configuration complète
- [ ] Remplacer toutes les références Stripe dans le code
- [ ] Mettre à jour les variables d'environnement

#### 2.2 Nouveaux endpoints Adyen
```typescript
// Remplacer complètement les routes payments existantes
- POST /api/public/payments/create-session (au lieu de create-intent)
- POST /api/public/adyen/webhook
- GET /api/public/payments/config (avec config Adyen)
```

#### 2.3 Mise à jour des modèles Prisma
```sql
-- Supprimer les champs Stripe et ajouter Adyen
ALTER TABLE "Tenant" DROP COLUMN "stripeAccountId";
ALTER TABLE "Tenant" DROP COLUMN "stripeAccountStatus";
ALTER TABLE "Tenant" ADD COLUMN "adyenSubMerchantId" TEXT;

ALTER TABLE "Booking" DROP COLUMN "stripePaymentId";
ALTER TABLE "Booking" ADD COLUMN "adyenPaymentReference" TEXT;

ALTER TABLE "Payment" DROP COLUMN "stripePaymentId";
ALTER TABLE "Payment" ADD COLUMN "adyenPspReference" TEXT;
```

### Phase 3 : Frontend - Remplacement complet (1 semaine)

#### 3.1 Suppression Stripe et installation Adyen
```bash
# Supprimer Stripe
npm uninstall @stripe/stripe-js @stripe/react-stripe-js

# Installer Adyen
npm install @adyen/adyen-web
```

#### 3.2 Remplacement des composants
- [ ] Supprimer `stripe-wrapper.tsx` et `stripe-payment-form.tsx`
- [ ] Créer `adyen-checkout.tsx` avec Drop-in
- [ ] Mettre à jour toutes les pages utilisant le paiement

### Phase 4 : Tests et Go Live (1 semaine)

#### 4.1 Tests complets
- [ ] Tester tous les moyens de paiement (cartes, locaux, Israël)
- [ ] Valider les webhooks
- [ ] Tester remboursements et annulations
- [ ] Tests de charge

#### 4.2 Mise en production
- [ ] Déployer directement avec Adyen
- [ ] Monitoring des premiers paiements
- [ ] Support prêt pour les questions

## 🚨 Points d'attention pour migration directe

### 1. Changements immédiats
- **Nouvelles clés API** : Remplacer toutes les variables d'environnement Stripe
- **Formats différents** : Adapter le code aux formats Adyen (montants, statuts, etc.)
- **Webhooks** : Nouvelle URL et format de signature

### 2. Différences techniques majeures

#### Montants
- **Stripe** : Montants en centimes (10000 = 100.00 EUR)
- **Adyen** : Montants en minor units mais format différent

#### Statuts
- **Stripe** : `succeeded`, `processing`, `failed`
- **Adyen** : `Authorised`, `Refused`, `Pending`, `Cancelled`

#### Remboursements
- **Stripe** : Remboursement partiel natif
- **Adyen** : Modifications de paiement plus flexibles

### 3. Fonctionnalités Adyen à exploiter

1. **Moyens de paiement locaux** :
   - iDEAL (Pays-Bas)
   - Sofort (Allemagne)
   - Bancontact (Belgique)
   - SEPA Direct Debit
   - **Israël** : Cartes locales (Isracard, Leumi Card), virements bancaires israéliens

2. **Risk management** :
   - RevenueProtect inclus
   - Règles personnalisées anti-fraude
   - 3D Secure dynamique
   - **Règles spécifiques Israël** pour détecter la fraude locale

3. **Marketplace avancé** :
   - Split payments natifs
   - Gestion des sous-marchands
   - Reporting par vendeur

## 📊 Métriques de succès

### KPIs à suivre
1. **Taux de conversion** : Doit rester stable ou s'améliorer
2. **Taux d'échec** : < 2% après stabilisation
3. **Temps de traitement** : < 3 secondes pour 95% des paiements
4. **Coût par transaction** : Réduction de 15-20% attendue
5. **Support tickets** : Pas d'augmentation significative

### Tableau de bord de migration
```typescript
// Métriques à tracker
interface MigrationMetrics {
  provider: 'stripe' | 'adyen';
  successRate: number;
  averageProcessingTime: number;
  failureReasons: Record<string, number>;
  revenueProcessed: number;
  transactionCount: number;
}
```

## 🇮🇱 Configuration spécifique pour Israël

### 1. Prérequis Adyen Israël
- **Entity légale israélienne** : Nécessaire pour traiter les paiements locaux
- **Compte bancaire israélien** : Pour recevoir les virements en ILS (Shekel)
- **Numéro de TVA israélien** : Pour la conformité fiscale
- **Certificat PCI-DSS** : Obligatoire pour les marchands israéliens

### 2. Moyens de paiement israéliens

#### Cartes locales
```typescript
// Configuration spécifique Israël
const israelPaymentMethods = {
  // Cartes de crédit israéliennes
  isracard: {
    enabled: true,
    installments: {
      enabled: true,
      plans: [3, 6, 12, 24] // Paiements échelonnés populaires en Israël
    }
  },
  leumiCard: { enabled: true },
  
  // Virements bancaires
  bankTransferIL: {
    enabled: true,
    banks: ['Hapoalim', 'Leumi', 'Discount', 'Mizrahi']
  }
};
```

### 3. Conformité réglementaire israélienne

#### 3.1 Exigences légales
- **Factures en hébreu** : Obligatoires pour les clients israéliens
- **Taux de TVA** : 17% (à vérifier régulièrement)
- **Reporting fiscal** : Déclarations mensuelles à l'administration fiscale

#### 3.2 Protection des consommateurs
```typescript
// Règles spécifiques Israël
const israelConsumerRules = {
  // Droit de rétractation de 14 jours
  cancellationPeriod: 14,
  
  // Affichage obligatoire des prix en ILS
  currency: 'ILS',
  
  // Information claire sur les paiements échelonnés
  installmentDisclosure: true
};
```

### 4. Optimisations pour le marché israélien

#### 4.1 Heures de pointe
- **Dimanche-Jeudi** : Jours ouvrables (pic 19h-22h)
- **Vendredi** : Demi-journée (pic 10h-14h)
- **Samedi soir** : Reprise d'activité après Shabbat

#### 4.2 Périodes importantes
- **Fêtes juives** : Adapter la disponibilité du support
- **Pessah/Souccot** : Haute saison touristique
- **Juillet-Août** : Vacances scolaires israéliennes

### 5. Configuration technique Israël

```typescript
// adyen-israel.config.ts
export const israelConfig = {
  // Endpoint spécifique région
  liveEndpointUrlPrefix: 'YOUR_ISRAEL_PREFIX',
  
  // Configuration régionale
  region: 'IL',
  timezone: 'Asia/Jerusalem',
  
  // Paramètres de risque adaptés
  riskRules: {
    // Seuils adaptés au marché israélien
    highRiskThreshold: 5000, // ILS
    
    // Règles anti-fraude locales
    israelSpecificRules: [
      'block_suspicious_international_cards',
      'verify_israeli_id_number',
      'check_local_phone_format'
    ]
  },
  
  // Support multilingue
  locales: ['he-IL', 'en-IL', 'ar-IL'],
  defaultLocale: 'he-IL'
};
```

### 6. Intégration avec les banques israéliennes

```typescript
// Services bancaires israéliens
interface IsraeliBankingIntegration {
  // Validation IBAN israélien
  validateIsraeliIBAN(iban: string): boolean;
  
  // Conversion de devises
  getExchangeRate(from: 'USD' | 'EUR', to: 'ILS'): Promise<number>;
  
  // Jours fériés bancaires
  getBankHolidays(year: number): Date[];
}
```

### 7. Dashboard et reporting Israël

- **Rapports en hébreu** : Interface d'administration bilingue
- **Fuseau horaire** : Tous les rapports en heure d'Israël
- **Conformité fiscale** : Export automatique pour comptabilité israélienne

## 🎯 Timeline simplifiée (Migration directe)

- **Semaine 1** : Configuration Adyen + Setup Israël
- **Semaine 2** : Remplacement complet Backend
- **Semaine 3** : Remplacement complet Frontend
- **Semaine 4** : Tests et mise en production

**Durée totale : 4 semaines** (1 mois)

## 🔐 Checklist de sécurité

- [ ] Audit de sécurité du code Adyen
- [ ] Validation PCI-DSS maintenue
- [ ] Chiffrement des données sensibles
- [ ] Rotation des clés API planifiée
- [ ] Tests de pénétration post-migration
- [ ] Conformité RGPD vérifiée

## 📚 Ressources

### Documentation Adyen
- [API Reference](https://docs.adyen.com/api-explorer/)
- [Web Drop-in](https://docs.adyen.com/online-payments/web-drop-in)
- [Webhooks](https://docs.adyen.com/development-resources/webhooks)
- [Marketplace](https://docs.adyen.com/marketplaces-and-platforms)

### Outils de migration
- [Adyen Test Cards](https://docs.adyen.com/development-resources/test-cards/test-card-numbers)
- [API Migration Tool](https://github.com/Adyen/adyen-migration-tool)
- [Postman Collection](https://www.postman.com/adyen-team)

## 🚀 Prochaines étapes

1. **Validation du plan** avec l'équipe technique
2. **Ouverture compte Adyen** et négociation commerciale
3. **POC technique** sur une fonctionnalité simple
4. **Planning détaillé** avec ressources assignées
5. **Kick-off** de la migration

---

Ce plan de migration assure une transition en douceur de Stripe vers Adyen tout en minimisant les risques et en exploitant les avantages d'Adyen pour Villa SaaS.