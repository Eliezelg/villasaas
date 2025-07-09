# 🚀 Guide de Déploiement Villa SaaS

Ce guide vous accompagne pour déployer votre application sur Railway (backend) et Vercel (frontend).

## 📋 Prérequis

- ✅ Compte GitHub avec votre repo
- ✅ Supabase configuré
- ✅ Cloudflare R2 configuré
- ✅ OpenAI configuré

## 1️⃣ Déploiement Backend sur Railway

### Étape 1 : Créer un compte Railway

1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Autoriser Railway à accéder à vos repos

### Étape 2 : Créer un nouveau projet

1. Cliquer sur **"New Project"**
2. Choisir **"Deploy from GitHub repo"**
3. Sélectionner votre repo `villa-saas`
4. Railway détectera automatiquement qu'il s'agit d'un monorepo

### Étape 3 : Configurer le service backend

1. Dans les settings du service :
   - **Root Directory** : `villa-saas/apps/backend`
   - **Build Command** : `npm run build`
   - **Start Command** : `npm start`
   - **Port** : Railway détecte automatiquement depuis `PORT` env

2. **IMPORTANT** : Ajouter un healthcheck :
   - **Path** : `/health`
   - **Method** : `GET`

### Étape 4 : Variables d'environnement

Cliquer sur **"Variables"** et ajouter TOUTES les variables de `.env.production` :

```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database - Supabase
DATABASE_URL=postgresql://postgres.gcswwlhvuymhlzdbgbbh:Grenoble10%40%40%2C1006@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres.gcswwlhvuymhlzdbgbbh:Grenoble10%40%40%2C1006@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://gcswwlhvuymhlzdbgbbh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjc3d3bGh2dXltaGx6ZGJnYmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODIyMTUsImV4cCI6MjA2NzY1ODIxNX0.3Urt0mw3AZA5qBjOK2Ad3RjawgBw1MpDOlqiyJTUEGo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjc3d3bGh2dXltaGx6ZGJnYmJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA4MjIxNSwiZXhwIjoyMDY3NjU4MjE1fQ.DdXvGF9dHiDz7TNoJz1ExwTeYKVah4bkZO1mepfAQ9M

# JWT - IMPORTANT: Générer de nouvelles clés !
JWT_SECRET=[GÉNÉRER_UNE_NOUVELLE_CLÉ_SÉCURISÉE]
JWT_REFRESH_SECRET=[GÉNÉRER_UNE_NOUVELLE_CLÉ_SÉCURISÉE]
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Cloudflare R2
AWS_REGION=auto
AWS_ACCESS_KEY_ID=bd3ad13fca890036cbd894425b6f801c
AWS_SECRET_ACCESS_KEY=a6761cc7d6385ee051b77178a320aaba506cb0571a8974757e65d9079cfb0f73
AWS_S3_BUCKET=villa-saas-images
AWS_S3_ENDPOINT=https://91f5cb17497718e160ddd2020c86b751.r2.cloudflarestorage.com
AWS_CDN_DOMAIN=https://pub-88cf1b8c19574d4fa2c648f5b8ca9c14.r2.dev

# OpenAI
OPENAI_API_KEY=[VOTRE_CLÉ_OPENAI]
OPENAI_MODEL=gpt-4o-mini

# Redis - Railway fournira REDIS_URL automatiquement
# Email - À configurer avec vos clés Resend
# Stripe - À configurer avec vos clés Stripe
```

### Étape 5 : Ajouter Redis

1. Dans votre projet Railway, cliquer sur **"+ New"**
2. Choisir **"Database"** > **"Redis"**
3. Railway créera automatiquement la variable `REDIS_URL`

### Étape 6 : Déployer

1. Railway démarrera automatiquement le déploiement
2. Suivre les logs dans l'onglet **"Deployments"**
3. Une fois déployé, Railway génère une URL : `https://[votre-app].railway.app`

### Étape 7 : Domaine personnalisé (optionnel)

1. Dans **Settings** > **Networking** > **Public Networking**
2. Générer un domaine ou ajouter votre domaine personnalisé
3. Configurer votre DNS (CNAME vers Railway)

## 2️⃣ Déploiement Frontend sur Vercel

### Étape 1 : Créer un compte Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub

### Étape 2 : Importer le projet

1. Cliquer sur **"Add New..."** > **"Project"**
2. Importer votre repo GitHub
3. Vercel détectera le monorepo

### Étape 3 : Configurer le déploiement

1. **Framework Preset** : Next.js (auto-détecté)
2. **Root Directory** : `villa-saas/apps/unified`
3. **Build Command** : `npm run build` (par défaut)
4. **Output Directory** : `.next` (par défaut)

### Étape 4 : Variables d'environnement

Ajouter les variables pour le frontend :

```env
NEXT_PUBLIC_API_URL=https://[votre-backend].railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=https://[votre-app].vercel.app
```

### Étape 5 : Configuration multi-domaine

1. Dans **Settings** > **Domains**
2. Ajouter vos domaines :
   - `villa-saas.com` (principal)
   - `*.villa-saas.com` (wildcard pour multi-tenant)
   - Domaines personnalisés des clients

### Étape 6 : Déployer

1. Cliquer sur **"Deploy"**
2. Vercel construira et déploiera automatiquement
3. Votre app sera disponible sur `https://[projet].vercel.app`

## 3️⃣ Configuration Post-Déploiement

### Backend (Railway)

1. Vérifier que l'API répond : `https://[backend].railway.app/health`
2. Tester l'authentification : `https://[backend].railway.app/api/auth/login`
3. Vérifier les logs pour d'éventuelles erreurs

### Frontend (Vercel)

1. Mettre à jour `FRONTEND_URL` dans Railway avec l'URL Vercel
2. Configurer les redirections pour le multi-tenant
3. Tester la connexion frontend-backend

### CORS

Dans Railway, s'assurer que `FRONTEND_URL` et `ALLOWED_BOOKING_DOMAINS` sont correctement configurés pour autoriser Vercel.

## 4️⃣ Monitoring & Logs

### Railway
- Logs en temps réel dans l'onglet **"Logs"**
- Métriques dans l'onglet **"Metrics"**
- Alertes configurables

### Vercel
- Logs des fonctions dans **"Functions"**
- Analytics dans **"Analytics"**
- Vitals pour les performances

## 5️⃣ CI/CD Automatique

Les deux plateformes déploient automatiquement à chaque push sur `main` :

1. **Preview Deployments** : Pour chaque PR
2. **Production Deployments** : Sur merge dans `main`

## 🚀 Checklist Finale

- [ ] Backend accessible sur Railway
- [ ] Frontend accessible sur Vercel
- [ ] API répond correctement
- [ ] Authentification fonctionne
- [ ] Upload d'images fonctionne (R2)
- [ ] Base de données connectée (Supabase)
- [ ] Redis connecté
- [ ] Domaines configurés
- [ ] CORS configuré
- [ ] Variables d'environnement complètes

## 💡 Tips

1. **Secrets JWT** : Utiliser `openssl rand -base64 32` pour générer
2. **Debugging** : Activer `LOG_LEVEL=debug` temporairement
3. **Performance** : Activer le caching CDN sur Vercel
4. **Sécurité** : Activer 2FA sur Railway et Vercel

## 🆘 Troubleshooting

### Erreur "Cannot connect to database"
- Vérifier que l'IP de Railway est autorisée dans Supabase
- Vérifier l'encodage du mot de passe dans DATABASE_URL

### Erreur CORS
- Vérifier FRONTEND_URL dans les variables Railway
- Ajouter le domaine Vercel dans ALLOWED_BOOKING_DOMAINS

### Build failed
- Vérifier les logs de build
- S'assurer que toutes les dépendances sont dans package.json
- Vérifier la version de Node.js