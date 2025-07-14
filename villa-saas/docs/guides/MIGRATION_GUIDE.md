# Guide de Migration Villa SaaS - Stack Production

Ce guide vous accompagne dans la migration de votre stack de développement vers la stack de production recommandée.

## 📋 Ordre de migration recommandé

1. **Supabase** (Base de données) - 30 min
2. **Cloudflare R2** (Stockage images) - 30 min
3. **OpenAI** (IA) - 15 min
4. **Vercel + Railway** (Déploiement) - 1h
5. **Sentry** (Monitoring) - 15 min

## 1️⃣ Migration Supabase

### Étape 1 : Créer un compte Supabase
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet (région EU recommandée)
3. Attendre l'initialisation (~2 min)

### Étape 2 : Récupérer les credentials
Dans Settings > API, copier :
- `Project URL` : https://xxxxx.supabase.co
- `anon public` : eyJhbGci...
- `service_role` : eyJhbGci...

Dans Settings > Database, copier :
- Le mot de passe de la DB

### Étape 3 : Activer pgvector
Dans SQL Editor, exécuter :
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Étape 4 : Mettre à jour la configuration

Créer `.env.production` dans `apps/backend` :
```env
# Database Supabase
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
DIRECT_DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Supabase
SUPABASE_URL="https://[REF].supabase.co"
SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_KEY]"

# Garder les autres variables de .env.example
```

### Étape 5 : Migrer le schema
```bash
cd villa-saas/packages/database
# Mettre à jour DATABASE_URL dans .env
npx prisma db push
```

## 2️⃣ Migration Cloudflare R2

### Étape 1 : Créer un compte Cloudflare
1. [dash.cloudflare.com](https://dash.cloudflare.com)
2. Aller dans R2 Object Storage
3. Créer un bucket : `villa-saas-images`

### Étape 2 : Créer les credentials
1. R2 > Manage R2 API Tokens
2. Create API Token
3. Permissions : Object Read & Write
4. TTL : Permanent

### Étape 3 : Configurer l'accès public
1. Settings du bucket > Custom Domains
2. Ajouter : `images.votre-domaine.com`

### Étape 4 : Mettre à jour la configuration
Dans `.env.production` :
```env
# Cloudflare R2 (compatible S3)
AWS_REGION="auto"
AWS_ACCESS_KEY_ID="[R2_ACCESS_KEY]"
AWS_SECRET_ACCESS_KEY="[R2_SECRET_KEY]"
AWS_S3_BUCKET="villa-saas-images"
AWS_S3_ENDPOINT="https://[ACCOUNT_ID].r2.cloudflarestorage.com"
AWS_CDN_DOMAIN="https://images.votre-domaine.com"
```

### Étape 5 : Adapter le code
Dans `apps/backend/src/modules/properties/services/image.service.ts`, ajouter l'endpoint :
```typescript
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.AWS_S3_ENDPOINT, // Nouveau
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});
```

## 3️⃣ Activer OpenAI

### Étape 1 : Créer un compte OpenAI
1. [platform.openai.com](https://platform.openai.com)
2. Créer une API Key
3. Ajouter un crédit ($10 pour commencer)

### Étape 2 : Configuration
Dans `.env.production` :
```env
# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
```

### Étape 3 : Implémenter generateEmbedding
Dans `apps/backend/src/modules/properties/services/property-ai.service.ts` :
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}
```

## 4️⃣ Déploiement Vercel + Railway

### Backend sur Railway

1. Créer un compte sur [railway.app](https://railway.app)
2. New Project > Deploy from GitHub
3. Sélectionner votre repo
4. Configurer :
   ```
   Root Directory: villa-saas/apps/backend
   Build Command: npm run build
   Start Command: npm start
   ```
5. Ajouter toutes les variables d'environnement de `.env.production`
6. Railway génère automatiquement l'URL : `https://xxx.railway.app`

### Frontend sur Vercel

1. Créer un compte sur [vercel.com](https://vercel.com)
2. Import Git Repository
3. Configurer :
   ```
   Root Directory: villa-saas/apps/unified
   Framework Preset: Next.js
   ```
4. Variables d'environnement :
   ```env
   NEXT_PUBLIC_API_URL=https://xxx.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
   ```
5. Deploy !

### Configuration multi-domaine
Dans Vercel > Settings > Domains :
- Ajouter : `*.villa-saas.com` (wildcard)
- Ajouter les domaines custom des clients

## 5️⃣ Monitoring avec Sentry

### Étape 1 : Créer un compte Sentry
1. [sentry.io](https://sentry.io)
2. Create Project > Node.js + Next.js

### Étape 2 : Installation
```bash
# Backend
cd apps/backend
npm install @sentry/node @sentry/profiling-node

# Frontend  
cd apps/unified
npm install @sentry/nextjs
```

### Étape 3 : Configuration Backend
Dans `apps/backend/src/app.ts` :
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  tracesSampleRate: 1.0,
});
```

### Étape 4 : Configuration Frontend
Créer `apps/unified/sentry.client.config.ts` et `sentry.server.config.ts`

## ✅ Checklist de vérification

- [ ] Supabase : Schema Prisma poussé avec succès
- [ ] Cloudflare R2 : Upload d'image test fonctionne
- [ ] OpenAI : Génération d'embedding fonctionne
- [ ] Railway : Backend accessible via HTTPS
- [ ] Vercel : Frontend accessible + multi-domaine
- [ ] Sentry : Première erreur capturée

## 💰 Récapitulatif des coûts

| Service | Coût mensuel | Notes |
|---------|--------------|-------|
| Supabase | $25 | 8GB DB, 50GB bandwidth |
| Cloudflare R2 | ~$5 | 10GB storage, 1M requêtes |
| OpenAI | ~$10 | ~15k embeddings |
| Railway | $20 | 1GB RAM, auto-scaling |
| Vercel | $20 | Pro plan, multi-domaine |
| Sentry | $26 | 50k events |
| **TOTAL** | **~$106/mois** | |

## 🚀 Prochaines étapes

1. Configurer les backups Supabase
2. Activer Cloudflare WAF ($20/mois)
3. Ajouter Plausible Analytics ($19/mois)
4. Configurer les alertes de monitoring
5. Mettre en place le CI/CD avec GitHub Actions