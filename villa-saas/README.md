# Villa SaaS - Plateforme de Gestion de Locations de Vacances

Villa SaaS est une solution complète multi-tenant pour la gestion de propriétés de location de vacances. Elle permet aux propriétaires de gérer leurs biens, tarifs, disponibilités et réservations.

## 📚 Documentation

Toute la documentation est organisée dans le dossier [`docs/`](./docs/):
- [Documentation Overview](./docs/README.md) - Guide de la documentation
- [Getting Started](./docs/guides/GETTING_STARTED.md) - Démarrage rapide
- [API Documentation](./docs/api/API_DOCUMENTATION.md) - Référence API complète
- [System Architecture](./docs/architecture/SYSTEM_ARCHITECTURE.md) - Architecture technique

## 🚀 État du Projet

### Phase 1 ✅ Complétée
- Architecture monorepo avec npm workspaces
- Backend Fastify + TypeScript + Prisma
- Frontend Next.js 14 avec App Router
- Authentification JWT avec refresh tokens
- Multi-tenancy complet
- Tests et CI/CD

### Phase 2 ✅ Complétée (100%)
- ✅ Module de gestion des propriétés
- ✅ Système de tarification dynamique
- ✅ Documentation API complète
- ✅ Calendrier de disponibilité
- ✅ Module de réservations
- ✅ Analytics et rapports

### Phase 3 ✅ Complétée (100%)
- ✅ Sites de réservation publics multi-tenant
- ✅ Détection automatique du tenant par sous-domaine
- ✅ Calendrier de disponibilité interactif
- ✅ Tunnel de réservation multi-étapes
- ✅ Moteur de recherche avancé avec filtres
- ✅ Intégration Stripe pour les paiements
- ✅ Intégration AWS S3 pour le stockage d'images
- ✅ Système d'emails transactionnels (Resend)
- ✅ Internationalisation (i18n) avec next-intl
- ✅ Portail client avec authentification email + code
- ✅ PWA et fonctionnalités offline
- ✅ SEO optimisé (sitemap, Schema.org, meta tags)
- ✅ Marketing & Analytics (GA4, Facebook Pixel)
- ✅ Système de codes promotionnels

### Phase 4 🚀 En cours (5%)
- ✅ Hub AI - Plateforme intelligente de voyage
- ✅ Assistant conversationnel avec GPT-4
- ✅ Recherche sémantique avec embeddings
- ✅ Modèles de données pour ML et IA
- 🔄 Applications mobiles natives (React Native)
- 📅 Revenue Management Suite avec ML
- 📅 Intégration IoT et Smart Home
- 📅 Programme de fidélité blockchain

## 🛠 Technologies

### Backend
- **Framework**: Fastify 4.x
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma avec PostgreSQL
- **Cache**: Redis (requis pour rate limiting)
- **Auth**: JWT avec refresh tokens (cookies HttpOnly)
- **Docs**: Swagger/OpenAPI
- **Images**: Sharp pour l'optimisation + AWS S3
- **Emails**: Resend + React Email
- **Paiements**: Stripe Connect
- **Sécurité**: Helmet, CORS, bcrypt, @fastify/cookie
- **Monitoring**: Audit logs avec Prisma

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + Shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: Zustand
- **Maps**: OpenStreetMap/Nominatim
- **i18n**: next-intl (FR/EN)

## 📋 Prérequis
- Node.js 20+
- Docker et Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker) - Requis pour rate limiting et sessions
- OpenSSL (pour générer les secrets de production)

## Installation

1. **Installer les dépendances**
```bash
cd villa-saas
npm install
```

2. **Démarrer les services Docker**
```bash
cd ..
docker-compose up -d
```

3. **Configurer les variables d'environnement**
```bash
cd villa-saas/apps/backend
cp .env.example .env
# Éditer .env avec vos valeurs

# Pour la production, utiliser le template sécurisé :
cp .env.production.example .env.production
# Générer les secrets avec : openssl rand -base64 64

cd ../web
cp .env.example .env.local
# Éditer .env.local avec vos valeurs
```

4. **Initialiser la base de données**
```bash
cd ../..
npm run db:push
npm run db:seed
```

## Démarrage

### Tout démarrer (backend + frontend)
```bash
npm run dev
```

### Démarrer séparément

**Backend seulement:**
```bash
cd apps/backend
npm run dev
```

**Frontend seulement:**
```bash
cd apps/web
npm run dev
```

## 🌐 URLs

- **Dashboard Admin**: http://localhost:3000
- **Site de Réservation**: http://webpro200.com (ou http://demo.webpro200.com)
- **Hub AI**: http://localhost:3003
- **Backend API**: http://api.webpro200.com
- **API Documentation**: http://api.webpro200.com/documentation
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379

## Commandes utiles

```bash
# Tests
npm run test

# Linting
npm run lint

# Type checking
npm run typecheck

# Build
npm run build

# Prisma Studio
npm run db:studio

# Mise à jour de la base de données
./scripts/update-db.sh
```

## 🎯 Fonctionnalités Implémentées

### 🔐 Authentification & Multi-tenancy
- Inscription avec création automatique d'organisation
- Login/logout avec JWT et refresh tokens
- Isolation complète des données par tenant
- Gestion des rôles (ADMIN, OWNER, MANAGER, VIEWER)

### 🏠 Gestion des Propriétés
- CRUD complet avec statuts (brouillon, publié, archivé)
- Formulaire multi-étapes avec validation
- Description multilingue
- Configuration des équipements et ambiance
- Géolocalisation avec carte interactive
- Prévisualisation "comme un visiteur"

### 📸 Gestion des Images
- Upload multiple par drag & drop
- Réorganisation par glisser-déposer
- Optimisation automatique (4 tailles)
- Compression intelligente avec Sharp
- Support JPEG, PNG, WebP

### 💰 Système de Tarification
- **Périodes tarifaires**: Haute/basse saison avec priorités
- **Périodes chevauchantes**: Support complet avec système de priorités
- **Suppléments weekend**: Vendredi/samedi automatiques
- **Réductions long séjour**: 5% (7+ nuits), 10% (28+ nuits)
- **Durée minimum**: Par période configurable
- **Calculateur dynamique**: Prix en temps réel avec décomposition
- **Calendrier interactif**: Sélection de dates avec édition rapide
- **Frais additionnels**: Ménage, caution, taxe de séjour

### 📅 Calendrier de Disponibilité
- **Vue multi-mois**: Affichage 3 mois avec navigation
- **Gestion des périodes bloquées**: Maintenance, usage personnel
- **Synchronisation iCal**: Import/export avec Airbnb, Booking.com
- **Règles de réservation**: Jours d'arrivée/départ configurables
- **Visualisation complète**: Prix, disponibilité et règles sur un seul calendrier
- **API temps réel**: Vérification instantanée de la disponibilité

### 📊 Module de Réservations
- **Création manuelle**: Interface intuitive pour créer des réservations
- **Calcul automatique**: Prix calculé en temps réel avec toutes les règles
- **Vérification instantanée**: Disponibilité vérifiée avant création
- **Gestion des statuts**: Workflow complet (en attente, confirmé, annulé)
- **Actions rapides**: Confirmer ou annuler en un clic
- **Vue détaillée**: Toutes les informations sur une page
- **Notes internes**: Suivi personnalisé des clients
- **Filtres avancés**: Recherche par propriété, statut, dates, client

### 📚 Documentation API
- **Swagger UI**: Interface interactive à `/documentation`
- **Documentation Markdown**: Guide complet dans `API_DOCUMENTATION.md`
- **Collection Postman**: Prête à l'emploi avec tests automatiques
- **Schémas OpenAPI**: Tous les modèles documentés

## 🏗 Architecture

```
villa-saas/
├── apps/
│   ├── backend/         # API Fastify
│   └── web/            # Frontend Next.js
├── packages/
│   ├── database/       # Schéma Prisma + client
│   ├── types/          # Types TypeScript partagés
│   ├── utils/          # Utilitaires partagés
│   └── ui/            # Composants UI (future)
```

## 🔒 Sécurité

### Fonctionnalités de base
- ✅ Authentification JWT avec rotation des tokens
- ✅ Rate limiting (100 req/min)
- ✅ Validation stricte avec Zod
- ✅ Headers de sécurité (Helmet)
- ✅ CORS configuré
- ✅ Mots de passe hashés (bcrypt)
- ✅ Multi-tenancy au niveau DB

### 🛡️ Améliorations de Sécurité (Janvier 2025)

#### 1. **Migration vers Cookies HttpOnly**
- Stockage des JWT dans des cookies HttpOnly au lieu de localStorage
- Protection contre les attaques XSS
- Configuration secure/sameSite pour production
- Support automatique dans l'API client avec `credentials: 'include'`

#### 2. **Protection Brute Force**
- Limitation à 5 tentatives de connexion par IP/email
- Blocage temporaire de 15 minutes après dépassement
- Compteurs stockés dans Redis avec expiration automatique
- Protection sur login, register et refresh token

#### 3. **Validation Serveur des Paiements**
- Double vérification des montants Stripe côté serveur
- Calcul indépendant du prix pour prévenir la manipulation
- Tolérance de 0.01€ pour les arrondis
- Métadonnées sécurisées dans les sessions Stripe

#### 4. **Validation Stricte des Uploads**
- Vérification des magic bytes (signatures de fichiers)
- Validation MIME type réelle vs déclarée
- Limite de taille à 10MB par fichier
- Types autorisés : JPEG, PNG, WebP uniquement
- Détection des fichiers malveillants déguisés

#### 5. **Headers de Sécurité Renforcés**
- CSP (Content Security Policy) strict avec directives détaillées
- HSTS avec preload pour forcer HTTPS
- X-Frame-Options contre le clickjacking
- X-Content-Type-Options contre le MIME sniffing
- Referrer-Policy pour la confidentialité

#### 6. **RBAC et Permissions**
- Middleware de vérification des permissions granulaires
- Rôles : SUPER_ADMIN, ADMIN, MANAGER, VIEWER
- Permissions spécifiques par module
- Vérification automatique sur les routes protégées

#### 7. **Audit Logging Complet**
- Journalisation de toutes les actions sensibles
- Informations capturées : user, IP, user-agent, timestamp
- Actions trackées : auth, CRUD, paiements, permissions
- Service dédié avec méthodes helper

#### 8. **Sécurité des Webhooks**
- Validation des signatures Stripe sur tous les webhooks
- Vérification du timestamp pour prévenir les replay attacks
- Tolérance de 5 minutes pour les retards réseau
- Rejet automatique des requêtes non signées

#### 9. **Rotation des Refresh Tokens**
- Nouveau refresh token à chaque utilisation
- Invalidation automatique de l'ancien token
- Protection contre le vol de tokens
- Expiration après 7 jours d'inactivité

#### 10. **Configuration Production**
- Template .env.production.example avec instructions
- Génération sécurisée des secrets avec OpenSSL
- Documentation des variables sensibles
- Pas de secrets dans le code source

## 🧪 Tests

Le projet inclut des tests unitaires et d'intégration :

```bash
# Tous les tests
npm test

# En mode watch
npm run test:watch

# Avec coverage
npm run test:coverage
```

## 📖 Documentation

- **API**: Voir `apps/backend/API_DOCUMENTATION.md`
- **Swagger**: http://api.webpro200.com/documentation
- **Postman**: Importer `apps/backend/postman-collection.json`
- **Plans de développement**: Voir `PHASE_1_PLAN.md` et `PHASE_2_PLAN.md`

### 📊 Analytics et Rapports
- **Dashboard principal**: Vue d'ensemble avec KPIs en temps réel
- **Métriques disponibles**:
  - Taux d'occupation mensuel et annuel
  - Revenus totaux et moyens (par nuit, par réservation)
  - Top propriétés par performance
  - Sources de réservations
  - Durée moyenne de séjour
- **Visualisations**: Graphiques interactifs avec Recharts
- **Export de données**: CSV avec toutes les métriques
- **Filtres**: Par période, par propriété
- **API complète**: 4 endpoints dédiés aux analytics

### 🌐 Sites de Réservation Publics (Phase 3 - Complétée)
- **Multi-tenant**: Chaque propriétaire a son propre site avec sous-domaine
- **Booking app**: Application Next.js dédiée sur le port 3002
- **Internationalisation**: Support multilingue FR/EN avec next-intl
- **Tunnel de réservation**: 
  - Recherche avancée avec filtres multiples
  - Calendrier interactif pour sélection des dates
  - Formulaire multi-étapes (dates → infos → paiement)
  - Paiement sécurisé via Stripe
- **Emails transactionnels**:
  - Confirmation de réservation automatique
  - Templates React Email personnalisables
  - Service Resend pour l'envoi fiable
- **Stockage S3**:
  - Upload direct vers AWS S3
  - Redimensionnement automatique (4 tailles)
- **Portail Client**:
  - Authentification sécurisée avec email + code de réservation
  - Consultation des détails de réservation
  - JWT temporaire pour accès sécurisé
- **PWA & Offline**:
  - Service Worker pour fonctionnement hors ligne
  - Manifest pour installation sur mobile
  - Cache intelligent des ressources
- **SEO & Marketing**:
  - Sitemap dynamique généré automatiquement
  - Schema.org pour un meilleur référencement
  - Meta tags optimisés par page
  - Google Analytics 4 intégré
  - Facebook Pixel pour remarketing
- **Codes Promotionnels**:
  - Création et gestion depuis le dashboard admin
  - Validation en temps réel lors de la réservation
  - Support pourcentage ou montant fixe
  - Conditions multiples (montant min, durée min, propriétés)
  - URLs CDN pour performance optimale
  - Script de migration pour images existantes

## 📈 État d'avancement global

- **Phase 1** : ✅ 100% complétée
- **Phase 2** : ✅ 100% complétée
- **Phase 3** : ✅ 100% complétée

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'feat: add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est privé et propriétaire.# Force Railway rebuild ven. 25 juil. 2025 00:22:45 IDT
# Force Railway rebuild again ven. 25 juil. 2025 00:24:44 IDT
