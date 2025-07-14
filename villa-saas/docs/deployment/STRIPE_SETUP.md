# Configuration Stripe pour Villa SaaS

## 1. Configuration du compte Stripe

### Prérequis
- Compte Stripe (https://dashboard.stripe.com)
- Stripe CLI installé

### Étapes de configuration

#### 1.1 Récupérer les clés API
1. Allez sur https://dashboard.stripe.com/test/apikeys
2. Copiez les clés suivantes :
   - Secret key (sk_test_...)
   - Publishable key (pk_test_...)

#### 1.2 Activer Stripe Connect
1. Allez sur https://dashboard.stripe.com/test/settings/connect
2. Cliquez sur "Get started with Connect"
3. Choisissez "Express" pour le type de compte
4. Récupérez votre Client ID (ca_...)

#### 1.3 Configurer les webhooks avec Stripe CLI

##### Option A : Avec Stripe CLI (développement local)

```bash
# Se déconnecter du compte actuel
stripe logout

# Se connecter au bon compte Stripe
stripe login

# Vérifier le compte actif
stripe config --list

# Écouter les webhooks en local
stripe listen --forward-to localhost:3001/api/public/stripe/webhook

# Le CLI va afficher votre webhook secret : whsec_xxxxxxxxxxxx
```

##### Option B : Avec ngrok (développement local avec webhook permanent)

```bash
# Installer ngrok
npm install -g ngrok

# Exposer votre backend local
ngrok http 3001

# Utiliser l'URL ngrok dans le dashboard Stripe pour créer le webhook
# https://xxxxx.ngrok.io/api/public/stripe/webhook
```

##### Option C : Utiliser un environnement de test spécifique

Si vous avez plusieurs environnements de test dans le même compte Stripe :

```bash
# Utiliser la clé secrète de l'environnement de test spécifique
stripe listen --forward-to localhost:3001/api/public/stripe/webhook --api-key sk_test_YOUR_SECRET_KEY

# Exemple avec votre clé :
stripe listen --forward-to localhost:3001/api/public/stripe/webhook --api-key sk_test_YOUR_SECRET_KEY

# Le CLI va afficher un webhook secret spécifique à cet environnement
```

**Note** : Chaque environnement de test a ses propres :
- Clés API (sk_test_... et pk_test_...)
- Données de test (clients, paiements, etc.)
- Webhooks secrets

## 2. Configuration dans Villa SaaS

### Backend (.env)
```env
# Stripe
STRIPE_SECRET_KEY="sk_test_..." 
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Obtenu via stripe listen
STRIPE_CONNECT_CLIENT_ID="ca_..." # Depuis dashboard Connect
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## 3. Utilisation en développement

### Démarrer les services
```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/unified
npm run dev

# Terminal 3 - Stripe webhooks
stripe listen --forward-to localhost:3001/api/public/stripe/webhook
```

### Tester Stripe Connect
1. Créez un compte via l'onboarding
2. À l'étape "Configuration des paiements", cliquez sur "Configurer Stripe"
3. Vous serez redirigé vers Stripe Connect
4. Utilisez les données de test :
   - Email : test@example.com
   - Téléphone : 000 000 0000
   - Numéro de test : 4242 4242 4242 4242

## 4. Webhooks importants

Les webhooks suivants sont gérés par l'application :
- `payment_intent.succeeded` : Confirmation automatique des réservations
- `payment_intent.payment_failed` : Notification d'échec de paiement
- `charge.dispute.created` : Notification de litige

## 5. Mode test vs Production

### Mode test
- Utilisez toujours les clés commençant par `sk_test_` et `pk_test_`
- Les cartes de test : https://stripe.com/docs/testing#cards
- Pas de vrais paiements

### Production
- Remplacez toutes les clés test par les clés live
- Configurez un webhook endpoint permanent
- Activez HTTPS obligatoirement