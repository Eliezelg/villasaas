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

## 🛠 Technologies

### Backend
- **Framework**: Fastify 4.x
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma avec PostgreSQL
- **Cache**: Redis
- **Auth**: JWT avec refresh tokens
- **Docs**: Swagger/OpenAPI
- **Images**: Sharp pour l'optimisation

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + Shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: Zustand
- **Maps**: OpenStreetMap/Nominatim

## 📋 Prérequis
- Node.js 20+
- Docker et Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

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

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/documentation
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
./update-db.sh
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

- ✅ Authentification JWT avec rotation des tokens
- ✅ Rate limiting (100 req/min)
- ✅ Validation stricte avec Zod
- ✅ Headers de sécurité (Helmet)
- ✅ CORS configuré
- ✅ Mots de passe hashés (bcrypt)
- ✅ Multi-tenancy au niveau DB

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
- **Swagger**: http://localhost:3001/documentation
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

## 📈 État d'avancement global

- **Phase 1** : ✅ 100% complétée
- **Phase 2** : ✅ 100% complétée
- **Phase 3** : ⏳ À venir (Sites de réservation publics)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'feat: add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est privé et propriétaire.