# Configuration des Domaines Personnalisés

Ce guide explique comment configurer et gérer les domaines personnalisés pour Villa SaaS.

## Vue d'ensemble

Villa SaaS permet à chaque tenant de configurer un domaine personnalisé pour son site de réservation. Le système utilise l'API Vercel pour gérer automatiquement les domaines et les certificats SSL.

## Architecture

### 1. Backend
- **Plugin Vercel** : `apps/backend/src/plugins/vercel.ts`
- **Service Vercel** : `apps/backend/src/services/vercel.service.ts`
- **Routes API** : `apps/backend/src/modules/public-site/public-site.routes.ts`

### 2. Frontend
- **Interface de gestion** : `apps/unified/src/app/[locale]/admin/dashboard/settings/domains/page.tsx`

### 3. Base de données
- **Modèle PublicSite** : Stocke le domaine personnalisé et le sous-domaine par tenant

## Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```bash
# Vercel API (pour domaines personnalisés)
VERCEL_API_TOKEN="votre_token_api_vercel"
VERCEL_PROJECT_ID="id_du_projet_vercel"
VERCEL_TEAM_ID="id_de_equipe_vercel" # Optionnel
```

### 2. Obtenir les credentials Vercel

1. **Token API** :
   - Connectez-vous à [Vercel Dashboard](https://vercel.com/dashboard)
   - Allez dans Settings > Tokens
   - Créez un nouveau token avec les permissions "Full Access"

2. **Project ID** :
   - Dans votre projet Vercel, allez dans Settings
   - Copiez le "Project ID"

3. **Team ID** (si applicable) :
   - Dans les paramètres de votre équipe
   - Copiez le "Team ID"

## Utilisation

### 1. Interface administrateur

Les propriétaires peuvent gérer leurs domaines depuis :
`/admin/dashboard/settings/domains`

#### Fonctionnalités :
- Voir le sous-domaine gratuit (ex: `monsite.villasaas.com`)
- Ajouter/modifier un domaine personnalisé
- Vérifier le statut de configuration DNS
- Voir les instructions DNS à configurer

### 2. Configuration DNS

Lorsqu'un domaine est ajouté, le propriétaire doit configurer ces enregistrements DNS :

#### Pour un domaine apex (exemple.com) :
- **Type A** : `@` → `76.76.21.21`
- **Type CNAME** : `www` → `cname.vercel-dns.com`

#### Pour un sous-domaine (www.exemple.com) :
- **Type CNAME** : `www` → `cname.vercel-dns.com`

### 3. API Endpoints

#### Récupérer la configuration du site public
```http
GET /api/public-site
Authorization: Bearer {token}
```

#### Mettre à jour le domaine
```http
PATCH /api/public-site
Authorization: Bearer {token}
Content-Type: application/json

{
  "domain": "www.mondomaine.com"
}
```

#### Vérifier la disponibilité d'un domaine
```http
GET /api/public-site/check-domain?domain=www.mondomaine.com
Authorization: Bearer {token}
```

#### Vérifier le statut DNS
```http
GET /api/public-site/domain-status?domain=www.mondomaine.com
Authorization: Bearer {token}
```

## Script d'administration

Pour ajouter un domaine manuellement via CLI :

```bash
node villa-saas/scripts/add-custom-domain.js <tenantId> <domain>
```

Exemple :
```bash
node villa-saas/scripts/add-custom-domain.js clh123456789 www.mon-gite.com
```

## Flux de configuration

1. **Ajout du domaine** :
   - L'utilisateur entre son domaine dans l'interface
   - Le backend vérifie la disponibilité
   - Le domaine est enregistré dans PublicSite
   - L'API Vercel ajoute le domaine au projet

2. **Configuration DNS** :
   - L'interface affiche les enregistrements DNS requis
   - L'utilisateur configure ses DNS chez son registrar
   - Le système vérifie périodiquement le statut

3. **Activation** :
   - Une fois les DNS propagés (5-48h)
   - Vercel génère automatiquement le certificat SSL
   - Le site devient accessible via le domaine personnalisé

## Middleware de résolution

Le système utilise un middleware pour résoudre le tenant depuis le domaine :
- Vérifie d'abord le domaine personnalisé
- Puis le sous-domaine
- Enfin utilise le header `X-Tenant-Id` si présent

## Sécurité

1. **Isolation multi-tenant** : Chaque domaine est lié à un seul tenant
2. **Validation** : Les domaines sont validés pour éviter les injections
3. **SSL automatique** : Vercel gère les certificats Let's Encrypt
4. **CORS configuré** : Les domaines autorisés sont ajoutés dynamiquement

## Dépannage

### Le domaine n'est pas vérifié
- Vérifiez que les DNS sont correctement configurés
- Attendez la propagation DNS (jusqu'à 48h)
- Utilisez `nslookup` ou `dig` pour vérifier

### Erreur "Domain already exists"
- Le domaine est déjà utilisé sur un autre projet Vercel
- Contactez le support pour le libérer

### SSL ne fonctionne pas
- Vérifiez que le domaine est vérifié dans Vercel
- Les certificats sont générés automatiquement après vérification

## Limites

- Un seul domaine personnalisé par tenant
- Les domaines doivent être valides et accessibles
- La propagation DNS peut prendre jusqu'à 48h
- Les sous-domaines wildcard ne sont pas supportés

## Support

Pour toute question sur les domaines personnalisés :
1. Vérifiez d'abord le statut dans l'interface
2. Consultez les logs Vercel
3. Contactez le support technique