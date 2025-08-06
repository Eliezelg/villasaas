# Guide Rapide - Architecture des Domaines Villa SaaS

## 🌐 Structure des Domaines

### 1. **Domaine Principal - Administration**
- **URL** : `www.webpro200.fr`
- **Utilisation** : Portail d'administration où TOUS les propriétaires se connectent
- **Accès** : `/admin/login`

### 2. **Sous-domaines - Sites Publics**
- **URL** : `[subdomain].webpro200.fr`
- **Utilisation** : Sites de réservation publics pour chaque client
- **Exemple** : `villa-martin.webpro200.fr`

### 3. **Domaines Personnalisés (Optionnel)**
- **URL** : `www.client-domain.com`
- **Configuration** : Via l'interface admin ou l'API Vercel

## 🚀 Flux d'Inscription

1. Le client s'inscrit sur `www.webpro200.fr/admin/signup`
2. Il choisit son sous-domaine (ex: `villa-martin`)
3. Son site public est créé automatiquement : `villa-martin.webpro200.fr`
4. Il se connecte toujours sur `www.webpro200.fr` pour administrer

## 🛠️ Configuration Technique

### Variables d'environnement (.env)
```bash
# Frontend
NEXT_PUBLIC_MAIN_DOMAIN=webpro200.fr
NEXT_PUBLIC_API_URL=http://localhost:3001

# Backend (pour Vercel API)
VERCEL_API_TOKEN=xxx
VERCEL_PROJECT_ID=xxx
VERCEL_TEAM_ID=xxx
```

### Vercel Project Settings
1. Ajouter les domaines :
   - `www.webpro200.fr` (domaine principal)
   - `*.webpro200.fr` (wildcard pour les sous-domaines)

## 📝 Exemples Concrets

### Client "Villa Martin Cannes"
- **Inscription** : Choisit le sous-domaine `villa-martin`
- **Administration** : Se connecte sur `www.webpro200.fr`
- **Site public** : `villa-martin.webpro200.fr`
- **Domaine perso** : Peut ajouter `www.villa-martin-cannes.com` plus tard

### Client "Résidence Azur Nice"
- **Inscription** : Choisit le sous-domaine `residence-azur`
- **Administration** : Se connecte sur `www.webpro200.fr`
- **Site public** : `residence-azur.webpro200.fr`
- **Domaine perso** : Peut ajouter `www.residence-azur.fr` plus tard

## 🧪 Test Local

Pour tester en local avec des sous-domaines :

1. Éditer `/etc/hosts` (Linux/Mac) ou `C:\Windows\System32\drivers\etc\hosts` (Windows) :
```
127.0.0.1 www.webpro200.local
127.0.0.1 villa-martin.webpro200.local
127.0.0.1 residence-azur.webpro200.local
```

2. Lancer le backend :
```bash
cd apps/backend
npm run dev
```

3. Lancer le frontend :
```bash
cd apps/unified
npm run dev
```

4. Accéder aux URLs :
- Admin : `http://www.webpro200.local:3000`
- Site public : `http://villa-martin.webpro200.local:3000`

## 🔍 Scripts Utiles

```bash
# Vérifier la configuration des domaines
node scripts/test-domain-architecture.js

# Corriger les domaines mal configurés
node scripts/fix-domain-configuration.js

# Ajouter un domaine personnalisé
node scripts/add-custom-domain.js

# Créer les PublicSites manquants
node scripts/fix-missing-public-sites.js
```

## ⚠️ Points Importants

1. **Ne jamais** utiliser `www.webpro200.fr` comme domaine personnalisé d'un client
2. **Toujours** créer un PublicSite lors de l'inscription
3. **Les sous-domaines** sont en `.webpro200.fr`, pas `.villa-saas.com`
4. **L'admin** est toujours sur `www.webpro200.fr` pour tous les clients