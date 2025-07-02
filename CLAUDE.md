# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Villa SaaS - A multi-tenant vacation rental management platform currently in active development (Phase 2). The project consists of three main applications:
- **Dashboard**: Admin interface for property owners to manage listings ✅ En développement
- **Booking sites**: Public-facing booking websites with custom domains per property owner 🔄 À venir
- **Hub**: Future AI-powered marketplace for travelers 🔄 À venir

## Current Development Status

### ✅ Phase 1 - Complétée
- Architecture monorepo avec npm workspaces
- Backend Fastify + TypeScript + Prisma
- Frontend Next.js 14 avec App Router
- Authentification JWT avec refresh tokens
- Multi-tenancy complet
- Tests et CI/CD

### 🔄 Phase 2 - En cours (55% complété)
- ✅ Module de gestion des propriétés (100%)
- ✅ Système de tarification dynamique (100%)
- ✅ Documentation API complète (100%)
- ❌ Calendrier de disponibilité (0%)
- ❌ Module de réservations (0%)
- ❌ Analytics et rapports (0%)

## Development Commands

```bash
# Initial Setup
npm install
cp .env.example .env.local
docker-compose up -d
./update-db.sh

# Development
npm run dev           # Run backend (dans apps/backend)
npm run dev           # Run frontend (dans apps/web)

# Testing
npm test              # All tests
npm run test:watch    # Tests en mode watch

# Database
./update-db.sh        # Push schema changes + generate client
npm run db:studio     # Prisma Studio (dans packages/database)

# Build & Deploy
npm run build         # Build all apps
npm run start         # Start en production

# Utilitaires
npm run lint          # Linting
npm run typecheck     # Type checking
```

## 🚨 Points Critiques du Développement

### 1. Monorepo avec npm workspaces
- **Structure**: `apps/` pour les applications, `packages/` pour le code partagé
- **Dépendances**: Utiliser `file:../../packages/xxx` au lieu de `workspace:*`
- **Installation**: Toujours installer depuis la racine avec `npm install`

### 2. Multi-tenancy OBLIGATOIRE
```typescript
// ❌ JAMAIS
const property = await prisma.property.findFirst({
  where: { id: propertyId }
});

// ✅ TOUJOURS
const property = await prisma.property.findFirst({
  where: { 
    id: propertyId,
    tenantId: req.tenantId // OBLIGATOIRE
  }
});
```

### 3. Gestion des images de PropertyImage
- PropertyImage n'a PAS de tenantId (isolation via la relation property)
- Toujours vérifier la propriété d'abord, puis les images
```typescript
// Vérifier que la propriété appartient au tenant
const property = await prisma.property.findFirst({
  where: { id: propertyId, tenantId }
});
if (!property) throw new Error('Not found');

// Ensuite seulement, gérer les images
const image = await prisma.propertyImage.create({
  data: { propertyId, ... } // PAS de tenantId ici
});
```

### 4. Optimisation des images
- 4 tailles générées automatiquement : small (400px), medium (800px), large (1200px), original
- Format WebP pour la compression
- Stockage dans `apps/backend/uploads/properties/`
- URLs stockées dans le champ JSON `urls`

### 5. Géolocalisation
- API Nominatim (OpenStreetMap) pour le géocodage
- Pas de headers User-Agent depuis le navigateur
- Fallback sur recherche par ville si adresse introuvable

### 6. Tarification dynamique
- Périodes avec priorités (plus haute priorité = appliquée)
- Suppléments weekend automatiques (vendredi/samedi)
- Réductions long séjour : 5% (7+ nuits), 10% (28+ nuits)
- Service `PricingService` pour tous les calculs

## Architecture

### Project Structure (Réelle)
```
villa-saas/
├── apps/
│   ├── backend/      # API Fastify + TypeScript
│   └── web/          # Frontend Next.js 14
├── packages/
│   ├── database/     # Prisma schema + client
│   ├── types/        # Types TypeScript partagés
│   └── utils/        # Utilitaires partagés
├── update-db.sh      # Script mise à jour DB
└── package.json      # Workspaces npm
```

### Tech Stack
- **Backend**: Node.js 20, Fastify 4, TypeScript, Prisma 5
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Shadcn/ui
- **Database**: PostgreSQL with pgvector extension
- **Cache**: Redis
- **Queue**: BullMQ
- **Payments**: Stripe Connect

### Critical Patterns

#### 1. Multi-Tenancy (MANDATORY)
Every database query must include tenant isolation:
```typescript
// Always filter by tenantId
const property = await prisma.property.findFirst({
  where: { 
    id: propertyId,
    tenantId: req.tenantId // REQUIRED
  }
});
```

#### 2. Module Structure
Follow this pattern for all features:
```
modules/[feature]/
├── [feature].controller.ts  # Routes
├── [feature].service.ts     # Business logic
├── [feature].repository.ts  # DB queries
├── [feature].dto.ts         # Types/validation
└── [feature].test.ts        # Tests
```

#### 3. Input Validation
Use Zod for all input validation:
```typescript
const bookingSchema = z.object({
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().min(1).max(property.maxGuests)
});
```

#### 4. Audit Logging
Track all sensitive operations:
```typescript
await prisma.auditLog.create({
  data: { userId, action, details, ip: req.ip }
});
```

## Key Business Logic

### Pricing Calculation
- Base price varies by period (high/low season)
- Weekend supplements apply Friday/Saturday
- Long stay discounts: 5% (7+ nights), 10% (28+ nights)
- Tourist tax calculation based on local regulations

### Availability Rules
- Minimum stay requirements per period
- Check-in/out days restrictions
- Blocked dates for maintenance
- Real-time availability checking

### Payment Flow
1. Guest pays full amount to platform
2. Platform holds funds until check-in
3. After check-in, transfer to owner minus commission
4. Refunds follow cancellation policy rules

## AI-Ready Features

Properties include embedding fields for semantic search:
```prisma
model Property {
  searchableContent String?  @db.Text
  embedding         Float[]? 
  @@index([embedding(ops: VectorOps)])
}
```

Generate embeddings using OpenAI text-embedding-3-small model.

## Security Requirements

- JWT + refresh token authentication
- Rate limiting on all endpoints
- Tenant isolation at database level
- Input validation on all user data
- Audit logging for compliance
- No secrets in code - use environment variables

## Testing Strategy

- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test multi-tenancy isolation
- Test payment flows with Stripe test mode

## Development Methodology

### Phase-by-Phase Development Rules
1. **Create Phase Plan**: At the start of each development phase, create a detailed plan file (`PHASE_X_PLAN.md`)
2. **Complete Implementation**: Implement ALL features specified in the phase plan
3. **Test Everything**: Write tests for each functionality before moving to next phase
4. **Phase Review**: At phase end, review the plan file to ensure 100% completion
5. **Update Documentation**: Update README.md with completed features and new capabilities
6. **Never Skip Steps**: Follow the development plan in strict order - no jumping ahead
7. **Solve, Don't Bypass**: Always solve problems completely rather than finding workarounds

### Quality Standards
- All features must have unit tests
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- TypeScript strict mode compliance
- ESLint/Prettier compliance

## Current Status

Le projet est en développement actif (Phase 2) :
- Backend API fonctionnel avec 30+ endpoints
- Frontend avec dashboard propriétaire
- Gestion complète des propriétés avec images
- Système de tarification dynamique avec calendriers
- Documentation API Swagger complète

## 📝 Patterns de Code Importants

### Composants avec Optimistic UI
```typescript
// Pattern pour les mises à jour optimistes (ex: ImageUpload)
const [localState, setLocalState] = useState(serverState);

// Mise à jour optimiste
setLocalState(newState);

// Puis sync avec serveur
const { error } = await apiCall();
if (error) {
  setLocalState(serverState); // Rollback si erreur
}
```

### Services Frontend
```typescript
// Pattern standard pour les services
class ServiceName {
  async getAll() {
    return apiClient.get<Type[]>('/endpoint');
  }
  
  async create(data: CreateType) {
    return apiClient.post<Type>('/endpoint', data);
  }
}

export const serviceName = new ServiceName();
```

### Validation Zod + React Hook Form
```typescript
const schema = z.object({
  name: z.string().min(1, 'Requis'),
  price: z.coerce.number().positive()
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

## 🔧 Problèmes Résolus

1. **argon2 remplacé par bcryptjs** : Problèmes d'installation sur certains systèmes
2. **workspace:* remplacé par file:** : npm ne supporte pas le protocole workspace
3. **PropertyImage sans tenantId** : Isolation via la relation avec Property
4. **CORS pour images statiques** : Headers ajoutés dans le plugin static
5. **Géocodage Nominatim** : Pas de User-Agent depuis le navigateur

## 📋 Checklist Nouveau Module

Lors de l'ajout d'un nouveau module :

1. **Backend** :
   - [ ] Créer le fichier routes dans `modules/[module]/`
   - [ ] Ajouter les schémas Zod pour validation
   - [ ] Implémenter l'isolation multi-tenant
   - [ ] Enregistrer les routes dans `app.ts`
   - [ ] Ajouter la documentation Swagger
   - [ ] Créer les tests

2. **Frontend** :
   - [ ] Créer le service dans `services/`
   - [ ] Créer les types dans `types/`
   - [ ] Créer les composants dans `components/`
   - [ ] Ajouter les pages dans `app/dashboard/`
   - [ ] Implémenter la gestion d'erreurs
   - [ ] Ajouter les toasts de feedback

3. **Database** :
   - [ ] Ajouter le modèle dans `schema.prisma`
   - [ ] Vérifier les index nécessaires
   - [ ] Exécuter `./update-db.sh`
   - [ ] Tester avec Prisma Studio