# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Villa SaaS - A multi-tenant vacation rental management platform currently in active development. The project consists of two main applications:
- **Backend**: API Fastify + TypeScript pour la gestion des données ✅ Opérationnel
- **Unified**: Application Next.js unifiée remplaçant Dashboard, Booking sites et Hub ✅ En développement

## Current Development Status

### ✅ Phase 1 - Complétée
- Architecture monorepo avec npm workspaces
- Backend Fastify + TypeScript + Prisma
- Frontend Next.js 14 avec App Router
- Authentification JWT avec refresh tokens
- Multi-tenancy complet
- Tests et CI/CD

### ✅ Phase 2 - Complétée (100%)
- ✅ Module de gestion des propriétés (100%)
- ✅ Système de tarification dynamique (100%)
- ✅ Documentation API complète (100%)
- ✅ Calendrier de disponibilité (100%)
- ✅ Module de réservations (100%)
- ✅ Analytics et rapports (100%)

### 🚀 Phase 3 - En cours
- 🔄 Migration vers application Unified
- 🔄 Interface unifiée pour Dashboard, Booking et Hub
- 🔄 Support multi-domaines pour les sites de réservation

## Development Commands

```bash
# Initial Setup
npm install
cp .env.example .env.local
docker-compose up -d
./scripts/update-db.sh

# Development
npm run dev           # Run backend (dans apps/backend)
npm run dev           # Run unified app (dans apps/unified)

# Testing
npm test              # All tests
npm run test:watch    # Tests en mode watch

# Database
./scripts/update-db.sh        # Push schema changes + generate client
npm run db:studio     # Prisma Studio (dans packages/database)

# Build & Deploy
npm run build         # Build all apps
npm run start         # Start en production

# Utilitaires
npm run lint          # Linting
npm run typecheck     # Type checking
```

## 🚨 Points Critiques du Développement

### ⚠️ Corrections importantes suite aux tests
1. **Validation Fastify**: Ne jamais utiliser directement les schémas Zod dans les handlers Fastify. Toujours utiliser `z.object().parse()` dans le handler.
2. **IDs Prisma**: Les IDs générés par Prisma sont des CUIDs, pas des UUIDs. Utiliser `z.string().min(1)` au lieu de `z.string().uuid()`.
3. **Noms de champs corrects**:
   - Property: `surfaceArea` (pas `area`)
   - Booking: `total` (pas `totalPrice`)  
   - PropertyImage: `order` (pas `position`)
   - Property.periods (pas `pricingPeriods`)
4. **Statuts en majuscules**: Toujours `PUBLISHED`, `CONFIRMED`, etc. (jamais en minuscules)
5. **Authentication**: Utiliser `fastify.authenticate` dans preHandler (pas `authenticateUser`)
6. **Tenant ID**: Utiliser `getTenantId(request)` depuis @villa-saas/utils
7. **PricingService**: Pas de méthode `getPriceForDate`, utiliser `calculatePrice` avec la période complète

### ⚠️ IMPORTANT : Authentification Fastify
```typescript
// ❌ JAMAIS - authenticateUser n'existe pas
preHandler: [authenticateUser]

// ✅ TOUJOURS - Utiliser fastify.authenticate
preHandler: [fastify.authenticate]
```

### ⚠️ IMPORTANT : Validation avec Zod dans Fastify
```typescript
// ❌ JAMAIS - Ne pas passer les schémas Zod directement à Fastify
fastify.post('/route', {
  schema: {
    body: zodSchema
  }
})

// ✅ TOUJOURS - Valider manuellement dans le handler
fastify.post('/route', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const validation = zodSchema.safeParse(request.body);
  if (!validation.success) {
    return reply.code(400).send({ error: validation.error });
  }
  const data = validation.data;
  // ...
})
```

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
│   └── unified/      # Application Next.js unifiée (Dashboard + Booking + Hub)
├── packages/
│   ├── database/     # Prisma schema + client
│   ├── types/        # Types TypeScript partagés
│   └── utils/        # Utilitaires partagés
├── scripts/          # Scripts utilitaires
│   └── update-db.sh  # Script mise à jour DB
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

### 🔒 Améliorations de Sécurité Implémentées (Janvier 2025)

1. **Authentification Sécurisée**
   - JWT stockés dans des cookies HttpOnly (plus dans localStorage)
   - Protection contre le brute force (5 tentatives max, blocage 15 min)
   - Rotation automatique des refresh tokens
   - Audit logging de toutes les tentatives de connexion

2. **Validation des Paiements Stripe**
   - Validation côté serveur des montants (protection manipulation prix)
   - Webhooks Stripe avec validation de signature
   - Capture du raw body pour vérification

3. **Protection des Uploads**
   - Validation stricte des types de fichiers (magic bytes)
   - Scan de contenu malveillant
   - Sanitisation des noms de fichiers
   - Limites de taille par type

4. **Headers de Sécurité**
   - CSP (Content Security Policy) configurée
   - HSTS avec preload (31536000 secondes)
   - Protection XSS, clickjacking, MIME sniffing
   - CORS restrictif pour production

5. **Contrôle d'Accès (RBAC)**
   - Middleware de permissions par rôle
   - 3 rôles: OWNER, ADMIN, USER
   - Permissions granulaires par action
   - Audit logging des accès refusés

6. **Audit et Monitoring**
   - Service d'audit centralisé
   - Logging de toutes les opérations sensibles
   - Recherche et retention des logs
   - Intégration prête pour Sentry

### Configuration des Cookies Sécurisés
```typescript
// Backend - Configuration @fastify/cookie
await app.register(cookie, {
  secret: process.env.COOKIE_SECRET || process.env.SESSION_SECRET,
  parseOptions: {}
});

// Définition des cookies après login
reply.cookie('access_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 15 * 60 * 1000 // 15 minutes
});

// Frontend - Inclure les cookies dans les requêtes
fetch(url, {
  credentials: 'include', // IMPORTANT
  // ...
});
```

### Middleware d'Authentification Amélioré
```typescript
// Le middleware vérifie d'abord les cookies, puis les headers
if (request.cookies && request.cookies.access_token) {
  token = request.cookies.access_token;
} else if (request.headers.authorization) {
  // Fallback sur Authorization header
}
```

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

Le projet a terminé la Phase 2 avec succès (100% complétée) et est maintenant en Phase 3 :
- Backend API fonctionnel avec 50+ endpoints testés et opérationnels
- Application Unified en développement remplaçant les 3 apps séparées
- Gestion complète des propriétés avec images optimisées
- Système de tarification dynamique avec périodes et calendrier interactif
- Calendrier de disponibilité avec synchronisation iCal (Airbnb, Booking.com)
- Module de réservations complet avec calcul de prix automatique
- Analytics et rapports avec dashboard, métriques et export CSV
- Documentation API Swagger complète et à jour
- Tests d'intégration complets (100% des endpoints passent)

### Architecture Unified App

L'application Unified combine :
- **Dashboard** : Interface d'administration pour les propriétaires
- **Booking** : Sites de réservation publics avec domaines personnalisés
- **Hub** : Future marketplace AI pour les voyageurs

La distinction se fait par :
- Le domaine d'accès (admin.villa-saas.com vs custom-domain.com)
- L'authentification (propriétaires vs visiteurs publics)
- Le contexte de l'application (mode dashboard vs mode booking)

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
6. **Authentification Fastify** : Utiliser `fastify.authenticate` au lieu de `authenticateUser`
7. **Validation Fastify avec Zod** : Ne pas utiliser Zod directement dans les schémas Fastify
8. **Périodes tarifaires chevauchantes** : Autorisées avec système de priorités
9. **IDs non-UUID** : Prisma génère des CUIDs, adapter la validation avec `z.string().min(1)`
10. **Champs inexistants corrigés** : coverImage → images, position → order, pricingPeriods → periods
11. **PricingService refactoré** : Suppression de getPriceForDate, utilisation de calculatePrice
12. **Statuts toujours en majuscules** : PUBLISHED, CONFIRMED, COMPLETED (jamais en minuscules)
13. **API Client 204 No Content** : Gérer les réponses sans body pour éviter les erreurs JSON
14. **reply.setCookie n'existe pas** : Utiliser `reply.cookie()` avec @fastify/cookie
15. **Tokens en localStorage vulnérable** : Migration vers cookies HttpOnly
16. **Next.js vulnérabilités** : Mise à jour de 14.1.0 vers 14.2.30

## 🔴 Règles CRITIQUES de Développement

### 1. Routes API Frontend OBLIGATOIRE
```typescript
// ✅ TOUJOURS avec /api/
apiClient.get('/api/properties')
apiClient.post('/api/bookings')

// ❌ JAMAIS sans /api/
apiClient.get('/properties')
apiClient.post('/bookings')
```

### 4. Gestion des réponses 204 No Content
```typescript
// ✅ TOUJOURS vérifier le status 204 avant de parser JSON
if (response.status === 204) {
  return { data: null };
}
const data = await response.json();

// ❌ JAMAIS parser directement sans vérifier
const data = await response.json(); // Erreur si 204
```

### 2. Gestion des données undefined
```typescript
// ✅ TOUJOURS vérifier
const { data } = await service.getData();
if (data) {
  setExportUrl(data.url);
}

// ❌ JAMAIS directement
setExportUrl(data.url); // Erreur si data undefined
```

### 3. TypeScript Array.from pour Set
```typescript
// ✅ CORRECT pour la compatibilité
const uniqueIds = Array.from(new Set(items.map(i => i.id)));

// ❌ INCORRECT - Erreur de build
const uniqueIds = [...new Set(items.map(i => i.id))];
```

## 📋 Checklist Nouveau Module

Lors de l'ajout d'un nouveau module :

1. **Backend** :
   - [ ] Créer le fichier routes dans `modules/[module]/`
   - [ ] Utiliser `fastify.authenticate` pour l'auth
   - [ ] Valider avec Zod DANS le handler, pas dans le schema
   - [ ] Implémenter l'isolation multi-tenant
   - [ ] Enregistrer les routes dans `app.ts`
   - [ ] Ajouter la documentation Swagger
   - [ ] Implémenter les permissions RBAC avec `requirePermission()`
   - [ ] Ajouter l'audit logging sur les opérations sensibles
   - [ ] Créer les tests

2. **Frontend (Unified App)** :
   - [ ] Créer le service dans `services/` avec routes `/api/`
   - [ ] Créer les types dans `types/`
   - [ ] Créer les composants dans `components/`
   - [ ] Ajouter les pages dans `app/` selon le contexte (dashboard/booking/hub)
   - [ ] Configurer `credentials: 'include'` pour les cookies
   - [ ] Gérer les données undefined
   - [ ] Implémenter la gestion d'erreurs
   - [ ] Ajouter les toasts de feedback
   - [ ] Gérer les contextes multi-apps (dashboard vs booking vs hub)

3. **Database** :
   - [ ] Ajouter le modèle dans `schema.prisma`
   - [ ] Vérifier les index nécessaires
   - [ ] Exécuter `./scripts/update-db.sh`
   - [ ] Tester avec Prisma Studio

## 🔐 Fichiers de Sécurité Importants

- `apps/backend/src/middleware/rbac.middleware.ts` - Contrôle d'accès par rôle
- `apps/backend/src/services/audit.service.ts` - Service d'audit logging
- `apps/backend/src/utils/file-validator.ts` - Validation des uploads
- `apps/backend/.env.production.example` - Template pour les variables de production
- `SECURITY_AUDIT_REPORT.md` - Rapport d'audit de sécurité complet
- `SECURITY_FIXES_COMPLETED.md` - Résumé des corrections effectuées