# 🔧 Correction Vercel

## Problème
Vercel détectait un `pnpm-lock.yaml` alors que le projet utilise npm.

## Actions effectuées

1. ✅ **Supprimé** `pnpm-lock.yaml`
2. ✅ **Corrigé** les scripts pnpm dans `package.json`
3. ✅ **Créé** `vercel.json` pour configurer le build

## Prochaines étapes

### 1. Commit et push
```bash
git add -A
git commit -m "fix: supprimer pnpm-lock et configurer Vercel pour npm"
git push
```

### 2. Dans Vercel

Si le build échoue encore, configurez manuellement :

1. **Settings > General**
2. **Framework Preset** : Next.js
3. **Root Directory** : `villa-saas/apps/unified`
4. **Build Command** : Laisser par défaut ou `npm run build`
5. **Install Command** : `cd ../.. && npm install`

### 3. Variables d'environnement

Ajouter dans Vercel :
```env
NEXT_PUBLIC_API_URL=https://[votre-backend].railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=https://[votre-app].vercel.app
```

## Alternative : Override dans Vercel UI

Si les problèmes persistent, dans Vercel Settings :
- **Override** : Activer
- **Install Command** : `npm install --prefix ../..`
- **Build Command** : `cd ../.. && npm run build --workspace=@villa-saas/unified`

## Vérification

Le build devrait maintenant :
1. Utiliser npm (pas pnpm)
2. Installer les dépendances du monorepo
3. Builder l'app unified correctement