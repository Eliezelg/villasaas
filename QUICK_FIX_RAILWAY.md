# 🚀 Solution Rapide pour Railway

## Le problème
Railway utilise `npm ci` qui nécessite un `package-lock.json`, mais votre monorepo a le lock file au niveau racine, pas dans le backend.

## Solutions

### Option 1 : Modifier la commande build dans Railway UI
Dans Railway Settings > Build & Deploy :
- **Build Command** : `npm install --production=false && npm run build`
(au lieu de `npm ci`)

### Option 2 : Commit les changements
```bash
git add villa-saas/apps/backend/nixpacks.toml
git commit -m "fix: utiliser npm install au lieu de npm ci"
git push
```

### Option 3 : Utiliser Render.com (Plus simple)
[Render.com](https://render.com) gère mieux les monorepos :
1. Connecter GitHub
2. New > Web Service
3. Root Directory : `villa-saas/apps/backend`
4. Build : `npm install && npm run build`
5. Start : `npm start`

### Option 4 : Créer un package-lock.json local
```bash
cd villa-saas/apps/backend
npm install
git add package-lock.json
git commit -m "add: package-lock.json pour Railway"
git push
```

## Recommandation
Je recommande **Render.com** pour éviter ces complications. Railway est excellent mais peut être capricieux avec les monorepos.