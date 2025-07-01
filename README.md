# Villa SaaS

Plateforme de gestion de locations de vacances multi-tenant.

## Structure du projet

```
villacustom/
├── backend/      # API Fastify + TypeScript
├── frontend/     # Next.js 14 avec App Router
└── docs/         # Documentation complète
```

## Stack technique

- **Backend**: Node.js 20, Fastify 4, TypeScript, Prisma 5
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Shadcn/ui
- **Base de données**: PostgreSQL avec pgvector
- **Cache**: Redis
- **Paiements**: Stripe Connect

## Démarrage rapide

### Prérequis

- Node.js 20+
- pnpm 8+
- Docker et Docker Compose

### Installation

```bash
# Backend
cd backend
pnpm install
cp .env.example .env

# Frontend
cd ../frontend
pnpm install
cp .env.example .env.local
```

### Base de données

```bash
# Démarrer PostgreSQL et Redis
docker-compose up -d

# Appliquer les migrations
cd backend
pnpm db:push
pnpm db:seed
```

### Développement

```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

## Documentation

- [Cahier des charges](docs/cahier-charges-villa-saas-v2.md)
- [Guide développeur](docs/villa-saas-dev-guide.md)
- [Fonctionnalités détaillées](docs/villa-saas-fonctionnalites-detaillees.md)

## Progression

Phase 1 - Infrastructure de base (en cours)