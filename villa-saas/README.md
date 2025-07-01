# Villa SaaS - Guide de démarrage

## Prérequis
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

## URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5433
- Redis: localhost:6379

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
```