# Configuration du Webhook Stripe pour les emails de confirmation

## ⚠️ PROBLÈME IDENTIFIÉ

Les emails de confirmation ne sont pas envoyés car le webhook Stripe n'est pas configuré en production.

## 📋 ÉTAPES DE CONFIGURATION

### 1. Créer le webhook dans Stripe Dashboard

1. Connectez-vous à [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez dans **Developers → Webhooks**
3. Cliquez sur **"Add endpoint"**
4. Configurez comme suit :
   - **Endpoint URL** : `https://api.webpro200.fr/api/public/stripe/webhook`
   - **Description** : "Villa SaaS - Production Webhook"
   - **Events to listen** : Sélectionnez :
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed` (optionnel)

5. Cliquez sur **"Add endpoint"**

### 2. Récupérer le Signing Secret

1. Une fois le webhook créé, cliquez dessus
2. Dans la section **"Signing secret"**, cliquez sur **"Reveal"**
3. Copiez le secret (commence par `whsec_`)

### 3. Mettre à jour les variables d'environnement

#### Sur Railway :

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre projet **villa-backend**
3. Allez dans **Variables**
4. Mettez à jour :
   ```
   STRIPE_WEBHOOK_SECRET=whsec_[VOTRE_SECRET_ICI]
   ```
5. Railway redéploiera automatiquement

#### Dans votre fichier `.env` local (pour référence) :

```bash
# Webhook local (stripe listen)
STRIPE_WEBHOOK_SECRET_LOCAL=whsec_b2f1fa1a1676be25f7fc2f23dcb740df70fde014761608de357138d70cf33a02

# Webhook production (depuis Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_[NOUVEAU_SECRET_DE_PRODUCTION]
```

### 4. Tester le webhook

#### Option A : Test depuis Stripe Dashboard

1. Dans le webhook créé, cliquez sur **"Send test webhook"**
2. Sélectionnez `payment_intent.succeeded`
3. Cliquez sur **"Send test webhook"**
4. Vérifiez la réponse (devrait être 200 OK)

#### Option B : Test avec une vraie transaction

1. Faites une réservation test sur votre site
2. Utilisez la carte de test : `4242 4242 4242 4242`
3. Vérifiez dans Stripe Dashboard → Webhooks → Votre webhook → "Webhook attempts"
4. L'email devrait être envoyé

### 5. Vérifier les logs

Dans Stripe Dashboard :
- Allez dans **Developers → Webhooks → [Votre webhook] → Webhook attempts**
- Vérifiez que les tentatives sont en succès (200)

Dans Railway :
- Vérifiez les logs du backend pour voir "Confirmation email sent"

## 🔍 DEBUGGING

Si les emails ne sont toujours pas envoyés :

1. **Vérifiez que le webhook est bien activé** dans Stripe Dashboard
2. **Vérifiez le Signing Secret** : il doit correspondre exactement
3. **Vérifiez les logs Railway** : `railway logs`
4. **Vérifiez les tentatives de webhook** dans Stripe Dashboard

## 📝 NOTES IMPORTANTES

- Le webhook LOCAL (`stripe listen`) et le webhook PRODUCTION ont des secrets différents
- Ne jamais committer les secrets dans Git
- Toujours utiliser HTTPS pour les webhooks en production
- Le webhook doit répondre rapidement (< 20 secondes) sinon Stripe le considère comme échoué

## ✅ CONFIRMATION

Une fois configuré, les emails de confirmation seront automatiquement envoyés quand :
1. Un client fait une réservation
2. Le paiement est confirmé par Stripe
3. Le webhook `payment_intent.succeeded` est déclenché
4. Le backend met à jour la réservation et envoie l'email via Resend