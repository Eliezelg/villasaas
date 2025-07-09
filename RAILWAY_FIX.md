# 🔧 Correction du déploiement Railway

## Problème
Railway essaie de construire depuis la racine du repo au lieu de `villa-saas/apps/backend`.

## Solutions appliquées

### Option 1 : Via l'interface Railway (Recommandé)

1. Dans Railway, allez dans les **Settings** de votre service
2. Dans la section **Build & Deploy**
3. Configurez :
   - **Root Directory** : `villa-saas/apps/backend`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`

### Option 2 : Fichiers de configuration (Déjà créés)

J'ai créé plusieurs fichiers de configuration :

1. **`/railway.json`** - Configuration globale
2. **`/nixpacks.toml`** - Configuration Nixpacks 
3. **`/villa-saas/apps/backend/railway.json`** - Configuration spécifique backend

## Actions à faire

### 1. Commit et push les fichiers
```bash
git add railway.json nixpacks.toml villa-saas/apps/backend/railway.json
git commit -m "fix: configuration Railway pour monorepo"
git push
```

### 2. Dans Railway

Option A : Redéployer avec la nouvelle config
- Railway devrait détecter automatiquement les fichiers de config

Option B : Configuration manuelle
- **Root Directory** : `villa-saas/apps/backend`
- **Build Command** : `npm install && npm run build`
- **Start Command** : `npm start`
- **Watch Paths** : `villa-saas/apps/backend/**`

### 3. Variables d'environnement

Assurez-vous que TOUTES les variables sont configurées dans Railway :
- Toutes les variables de `.env.production`
- Railway fournira automatiquement `PORT` et `REDIS_URL`

## Alternative : Template Railway

Si les problèmes persistent, utilisez un template :

1. Créer un nouveau service
2. Choisir "Empty Service"
3. Configurer manuellement :
   ```
   Root Directory: villa-saas/apps/backend
   Build Command: npm ci && npm run build
   Start Command: npm start
   ```

## Vérification

Une fois déployé, testez :
```bash
curl https://[votre-app].railway.app/health
```

Devrait retourner :
```json
{
  "status": "ok",
  "timestamp": "..."
}
```