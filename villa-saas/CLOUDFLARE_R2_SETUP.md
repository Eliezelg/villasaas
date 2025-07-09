# 🖼️ Migration vers Cloudflare R2

## 1. Créer un compte Cloudflare

1. Aller sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. Se connecter ou créer un compte

## 2. Activer R2

1. Dans le dashboard, cliquer sur **R2** dans le menu gauche
2. Si c'est votre première fois, accepter les conditions
3. Cliquer sur **Create bucket**
4. Nom du bucket : `villa-saas-images`
5. Location : Automatic (recommandé)
6. Créer le bucket

## 3. Créer les credentials API

1. Dans R2, cliquer sur **Manage R2 API Tokens**
2. Cliquer sur **Create API token**
3. Configuration :
   - Token name : `villa-saas-production`
   - Permissions : **Object Read & Write**
   - Specify bucket : Sélectionner `villa-saas-images`
   - TTL : **Forever**
4. Créer le token
5. **IMPORTANT** : Copier immédiatement :
   - Access Key ID
   - Secret Access Key
   - Endpoint (format : `https://[ACCOUNT_ID].r2.cloudflarestorage.com`)

## 4. Configurer un domaine personnalisé (optionnel mais recommandé)

1. Dans le bucket `villa-saas-images`, aller dans **Settings**
2. Section **Public Access**
3. **Custom Domains** > Add custom domain
4. Exemples :
   - `images.villa-saas.com`
   - `cdn.votre-domaine.com`
5. Cloudflare configurera automatiquement le CDN

## 5. Mettre à jour la configuration

Dans `apps/backend/.env.production` :
```env
# Cloudflare R2
AWS_REGION="auto"
AWS_ACCESS_KEY_ID="[VOTRE_ACCESS_KEY]"
AWS_SECRET_ACCESS_KEY="[VOTRE_SECRET_KEY]"
AWS_S3_BUCKET="villa-saas-images"
AWS_S3_ENDPOINT="https://[ACCOUNT_ID].r2.cloudflarestorage.com"
AWS_CDN_DOMAIN="https://images.villa-saas.com"  # ou votre domaine
```

## 6. Adapter le code

Le code est déjà compatible S3, il suffit d'ajouter l'endpoint R2.

### Fichier à modifier : `apps/backend/src/modules/properties/services/image.service.ts`

Localiser la création du S3Client et ajouter l'endpoint :

```typescript
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.AWS_S3_ENDPOINT, // Ajouter cette ligne
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});
```

## 7. Tester l'upload

1. Démarrer le backend avec les nouvelles variables
2. Créer une propriété et uploader une image
3. Vérifier dans Cloudflare Dashboard que l'image apparaît

## 💰 Coûts Cloudflare R2

- **Stockage** : $0.015/GB/mois (10x moins cher qu'AWS S3)
- **Requêtes** : $0.36/million (Class A), $0.036/million (Class B)
- **Bande passante** : GRATUITE (vs $0.09/GB sur AWS)
- **Transformations d'images** : Avec Cloudflare Images ($5/mois pour 100k images)

## 🚀 Avantages

1. **90% moins cher** que AWS S3
2. **CDN global inclus** (150+ locations)
3. **Pas de frais de sortie** (egress gratuit)
4. **Compatible S3** (migration facile)
5. **Transformations d'images** optionnelles

## ⚡ Performance

- Latence < 50ms globalement
- Cache automatique sur le CDN
- Compression Brotli automatique
- Support HTTP/3

## 📝 Notes

- R2 est en production chez Discord, Shopify, etc.
- Limite de 10GB par fichier
- Pas de classes de stockage (tout est "hot")
- Backups automatiques possibles vers un autre bucket