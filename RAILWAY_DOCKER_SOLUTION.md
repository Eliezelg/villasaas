# 🐳 Solution Docker pour Railway

## Le problème
Railway ne peut pas accéder aux packages du monorepo (`@villa-saas/database`, etc.) lors du build dans le sous-dossier.

## Solution : Utiliser Docker

### 1. Configuration Railway

Dans Railway Settings :
1. **Builder** : Changer de "Nixpacks" à **"Dockerfile"**
2. **Dockerfile Path** : `villa-saas/apps/backend/Dockerfile`
3. **Context Path** : `.` (racine du repo)

### 2. Commit et push

```bash
git add villa-saas/apps/backend/Dockerfile
git commit -m "add: Dockerfile pour Railway"
git push
```

### 3. Variables d'environnement

Assurez-vous que toutes les variables sont configurées dans Railway :
- Toutes les variables de `.env.production`
- Railway fournira automatiquement `PORT`

## Alternative : Render.com

Si Docker ne fonctionne toujours pas, essayez Render.com :

1. **Créer un compte** sur [render.com](https://render.com)
2. **New > Web Service**
3. **Connecter votre repo GitHub**
4. Configuration :
   - **Root Directory** : `villa-saas`
   - **Build Command** : `npm install && cd apps/backend && npm run build`
   - **Start Command** : `cd apps/backend && npm start`
5. **Ajouter les variables d'environnement**

## Vérification

Une fois déployé :
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

## Notes

- Le Dockerfile gère correctement les dépendances du monorepo
- Il copie les packages nécessaires avant le build
- Il utilise un build multi-stage pour optimiser la taille
- Sharp est installé avec les dépendances natives nécessaires