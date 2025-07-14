# Configuration de Stripe Billing

Ce guide explique comment configurer Stripe Billing pour les abonnements Villa SaaS.

## 1. Créer les produits et prix dans Stripe

Connectez-vous à votre dashboard Stripe et créez les produits suivants :

### Plan Starter
- **Nom** : Villa SaaS Starter
- **Prix** : 40.00 USD
- **Facturation** : Mensuelle
- **ID du prix** : Notez l'ID qui commence par `price_`

### Plan Standard
- **Nom** : Villa SaaS Standard
- **Prix** : 80.00 USD
- **Facturation** : Mensuelle
- **ID du prix** : Notez l'ID qui commence par `price_`

### Propriété supplémentaire (pour Plan Standard)
- **Nom** : Propriété supplémentaire
- **Prix** : 15.00 USD
- **Facturation** : Mensuelle
- **ID du prix** : Notez l'ID qui commence par `price_`

## 2. Configurer les variables d'environnement

Dans votre fichier `.env`, ajoutez :

```env
# IDs des prix Stripe (remplacez par vos vrais IDs)
STRIPE_PRICE_STARTER_MONTHLY=price_1XXXXXXXXXXXXXXXXXX
STRIPE_PRICE_STANDARD_MONTHLY=price_1XXXXXXXXXXXXXXXXXX
STRIPE_PRICE_EXTRA_PROPERTY=price_1XXXXXXXXXXXXXXXXXX

# Webhook pour les abonnements
STRIPE_SUBSCRIPTION_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXX
```

## 3. Configurer le webhook Stripe

### Option A : En développement (Stripe CLI)

```bash
stripe listen --forward-to localhost:3001/api/public/stripe/subscription-webhook
```

Copiez le webhook secret affiché et mettez-le dans `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`.

### Option B : En production

1. Dans le dashboard Stripe, allez dans **Développeurs** → **Webhooks**
2. Cliquez sur **Ajouter un endpoint**
3. URL : `https://votre-domaine.com/api/public/stripe/subscription-webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copiez le signing secret et mettez-le dans `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`

## 4. Tester le flow

1. Créez un nouveau compte sur `/admin/signup`
2. À l'étape 3, sélectionnez un plan payant
3. Utilisez les cartes de test Stripe :
   - **Succès** : 4242 4242 4242 4242
   - **Échec** : 4000 0000 0000 0002
4. Vérifiez que l'abonnement est créé dans Stripe
5. Vérifiez que le tenant est mis à jour avec les infos d'abonnement

## 5. Gestion des abonnements

Les utilisateurs peuvent gérer leur abonnement depuis :
- **Dashboard** : `/admin/dashboard/settings/billing`
- Actions disponibles :
  - Voir le plan actuel
  - Annuler l'abonnement
  - Changer de plan
  - Mettre à jour le moyen de paiement

## 6. Logique métier

### Limites par plan

- **Starter** : 1 propriété maximum
- **Standard** : 3 propriétés incluses + 15$/propriété supplémentaire
- **Enterprise** : Illimité (sur devis)

### Vérification des limites

Le backend vérifie automatiquement les limites lors de :
- La création d'une nouvelle propriété
- L'activation d'une propriété

### Facturation au prorata

Stripe gère automatiquement :
- Les changements de plan en cours de mois
- Les annulations avec remboursement au prorata
- Les ajouts de propriétés supplémentaires