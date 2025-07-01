# Phase 1 - Fondations et Infrastructure

## Objectif
Mettre en place l'infrastructure de base du projet Villa SaaS avec l'architecture multi-tenant, l'authentification et les premières API.

## Durée estimée
2 semaines

## Livrables

### 1. Structure Monorepo (Jour 1)
- [x] Initialiser le monorepo avec pnpm workspaces
- [x] Structure des dossiers selon l'architecture définie
- [x] Configuration de base (package.json, .gitignore, .env.example)

### 2. Packages de Base (Jour 1-2)
- [x] Package `@villa-saas/database`
  - Schema Prisma avec modèles de base (Tenant, User, Property)
  - Configuration multi-tenant
  - Scripts de migration et seed
- [x] Package `@villa-saas/types`
  - Types TypeScript partagés
  - Interfaces communes
- [x] Package `@villa-saas/utils`
  - Fonctions utilitaires communes
  - Helpers pour dates, validation, etc.
- [x] Package `@villa-saas/ui`
  - Configuration Tailwind CSS
  - Components de base avec Shadcn/ui

### 3. API Backend (Jour 3-5)
- [x] Application Fastify avec TypeScript
- [x] Structure modulaire (controller/service/repository)
- [x] Middleware d'authentification JWT
- [x] Middleware de tenant isolation
- [x] Rate limiting et sécurité de base
- [x] Modules initiaux:
  - Auth (login, register, refresh token)
  - Tenants (création, gestion)
  - Users (profil, permissions)
  - Properties (CRUD de base)

### 4. Base de Données (Jour 6-7)
- [x] Docker Compose pour PostgreSQL et Redis
- [x] Configuration pgvector extension
- [x] Schéma complet avec toutes les tables principales
- [x] Indexes optimisés
- [x] Données de seed pour développement

### 5. Tests et CI/CD (Jour 8-9)
- [x] Configuration Jest pour tests unitaires
- [x] Tests d'intégration pour API
- [x] GitHub Actions pour CI
- [x] Configuration ESLint et Prettier
- [x] Pre-commit hooks

### 6. Documentation (Jour 10)
- [x] README.md principal
- [x] Documentation API avec OpenAPI/Swagger
- [x] Guide de démarrage rapide
- [x] Architecture Decision Records (ADRs)

## Checklist de validation

### Infrastructure
- [ ] Le projet démarre avec `pnpm dev`
- [ ] PostgreSQL et Redis fonctionnent via Docker
- [ ] Les migrations Prisma s'appliquent correctement
- [ ] Le seed crée des données de test

### API
- [ ] Endpoint POST /auth/register fonctionne
- [ ] Endpoint POST /auth/login retourne JWT
- [ ] Les routes protégées requièrent authentication
- [ ] Le tenant isolation fonctionne sur toutes les queries
- [ ] CRUD properties fonctionne avec multi-tenancy

### Qualité
- [ ] Tous les tests passent
- [ ] ESLint ne retourne aucune erreur
- [ ] TypeScript compile sans erreur (strict mode)
- [ ] La CI GitHub Actions est verte

### Sécurité
- [ ] Les variables d'environnement sont documentées
- [ ] Aucun secret dans le code
- [ ] Rate limiting actif sur toutes les routes
- [ ] Validation des inputs avec Zod

## Notes importantes
- Utiliser pnpm exclusivement (pas npm ou yarn)
- Suivre strictement les patterns définis dans CLAUDE.md
- Chaque fonctionnalité doit avoir des tests
- Commiter régulièrement avec des messages clairs
- Ne pas implémenter de fonctionnalités de Phase 2

## Prochaine phase
Phase 2 - Dashboard Admin (gestion des propriétés, calendrier, tarifs)