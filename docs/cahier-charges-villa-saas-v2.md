# Cahier des Charges V2 - Villa SaaS
## Stratégie "Sites Custom First" avec Architecture IA-Ready

---

## 🎯 1. VISION & STRATÉGIE PRODUIT

### 1.1 Approche Stratégique
**Lancement en 2 temps :**
1. **Phase Privée (Mois 1-4)** : Sites custom pour propriétaires uniquement
2. **Phase Publique (Mois 5+)** : Hub central avec recherche IA révolutionnaire

**Avantages de cette approche :**
- Acquisition clients B2B avant le lancement B2C
- Données réelles pour entraîner l'IA
- Revenus SaaS récurrents immédiats
- Feedback propriétaires pour améliorer
- 100+ sites actifs au lancement du hub

### 1.2 Objectifs Business
| Période | Clients | MRR | Focus |
|---------|---------|-----|-------|
| Mois 2 | 10 | 490€ | Beta fermée |
| Mois 4 | 50 | 2,450€ | Optimisation |
| Mois 6 | 150 | 7,350€ | Lancement hub |
| Mois 12 | 500 | 24,500€ | Scale + IA |

### 1.3 Proposition de Valeur Unique
**Pour les Propriétaires (Phase 1) :**
- Site professionnel ultra-rapide en 5 minutes
- Système de réservation complet
- Paiements automatisés Stripe
- Tableau de bord intuitif
- Domaine personnalisé inclus
- Support FR réactif

**Pour les Voyageurs (Phase 2) :**
- Recherche IA en langage naturel
- Réservation instantanée sécurisée
- Prix transparents tout inclus
- Avis vérifiés
- Support 24/7

---

## 🏗️ 2. ARCHITECTURE TECHNIQUE SCALABLE

### 2.1 Vue d'Ensemble
```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
├─────────────────┬─────────────────┬────────────────────┤
│ Sites Custom    │ Dashboard Admin │ Hub Central        │
│ (Next.js SSG)   │ (Next.js)       │ (Next.js ISR)     │
│ *.villa.com     │ app.villa.com   │ hub.villa.com     │
└────────┬────────┴────────┬────────┴─────────┬──────────┘
         │                 │                   │
         └─────────────────┴───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  API Gateway │
                    │   (Nginx)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Backend API  │
                    │  (Fastify)   │
                    │   Node.js    │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐     ┌──────▼──────┐   ┌─────▼─────┐
    │Postgres │     │    Redis    │   │    S3     │
    │+pgvector│     │   Cache     │   │  Storage  │
    └─────────┘     └─────────────┘   └───────────┘
```

### 2.2 Stack Technique Détaillé

#### Backend API (Core Business Logic)
```typescript
// Stack Backend
- Runtime: Node.js 20 LTS
- Framework: Fastify 4 (performance)
- ORM: Prisma 5 (type-safety)
- Validation: Zod
- Auth: JWT + Refresh tokens
- Queue: BullMQ (jobs async)
- Email: Resend API
- Monitoring: Pino logger

// Structure modulaire
src/
├── modules/
│   ├── auth/          // Multi-tenant auth
│   ├── tenants/       // Gestion comptes
│   ├── properties/    // CRUD + IA prep
│   ├── bookings/      // Réservations
│   ├── payments/      // Stripe Connect
│   ├── analytics/     // Métriques
│   └── ai/           // Module IA (préparé)
├── shared/
│   ├── database/     // Prisma client
│   ├── cache/        // Redis wrapper
│   ├── storage/      // S3 client
│   └── utils/        // Helpers
└── plugins/          // Fastify plugins
```

#### Frontend Sites Custom (B2C)
```typescript
// Stack Sites Publics
- Framework: Next.js 14 App Router
- Rendering: SSG + ISR (performance)
- Styling: Tailwind CSS + Shadcn/ui
- État: Zustand (léger)
- Forms: React Hook Form + Zod
- Maps: Mapbox GL
- Analytics: Plausible

// Structure
app/
├── [domain]/         // Multi-tenant routing
│   ├── page.tsx     // Homepage
│   ├── property/    // Détails
│   ├── booking/     // Réservation
│   └── contact/     // Contact
└── api/
    └── revalidate/  // ISR on-demand
```

#### Dashboard Propriétaires (B2B)
```typescript
// Stack Dashboard
- Framework: Next.js 14 App Router
- UI: Tailwind + Tremor (charts)
- Tables: TanStack Table
- État: Zustand + React Query
- Calendrier: FullCalendar
- Export: ExcelJS

// Structure
app/
├── auth/            // Login/Register
├── dashboard/       // Vue d'ensemble
├── properties/      // Gestion biens
├── bookings/        // Réservations
├── calendar/        // Planning
├── analytics/       // Stats
└── settings/        // Configuration
```

### 2.3 Base de Données IA-Ready

```prisma
// schema.prisma - Structure optimisée pour l'IA

model Tenant {
  id                String   @id @default(cuid())
  slug              String   @unique // Sous-domaine
  name              String
  email             String
  customDomain      String?  @unique // domaine.com
  
  // Stripe
  stripeCustomerId  String?  @unique
  stripeAccountId   String?  @unique
  
  // Configuration
  settings          Json     @default("{}") 
  features          Json     @default("{}")
  branding          Json     @default("{}")
  
  // Statut
  plan              String   @default("starter")
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  
  // Relations
  users             User[]
  properties        Property[]
  bookings          Booking[]
  
  @@index([slug])
  @@index([customDomain])
}

model Property {
  id               String   @id @default(cuid())
  tenantId         String
  
  // Informations de base
  name             String
  slug             String   // URL-friendly
  type             String   // villa, apartment, house
  status           String   @default("draft") // draft, active, paused
  
  // Description multilingue (IA-ready)
  description      Json     // {fr: "...", en: "..."}
  shortDescription String   // Accroche courte
  
  // Localisation
  address          String
  city             String
  region           String
  country          String   @default("FR")
  postalCode       String
  coordinates      Json     // {lat: 43.5, lng: 5.4}
  
  // Capacité
  maxGuests        Int
  bedrooms         Int
  beds             Int
  bathrooms        Float    // 1.5 = 1 salle de bain + 1 WC
  area             Int?     // m²
  
  // 🎯 CHAMPS IA - Structure pour recherche sémantique
  
  // Caractéristiques structurées pour filtres
  amenities        Json     @default("{}") 
  // {
  //   essentials: {wifi: true, parking: true, kitchen: true},
  //   comfort: {pool: true, aircon: true, heating: true},
  //   family: {crib: true, highchair: true, swing: true},
  //   outdoor: {garden: true, bbq: true, terrace: true}
  // }
  
  // Atmosphère (scores 0-10 pour matching IA)
  atmosphere       Json     @default("{}")
  // {
  //   romantic: 8,
  //   family: 10,
  //   business: 3,
  //   party: 2,
  //   quiet: 9,
  //   luxury: 7
  // }
  
  // Proximités en mètres (pour recherche "proche de")
  proximity        Json     @default("{}")
  // {
  //   beach: 500,
  //   publicPool: 200,
  //   townCenter: 1000,
  //   trainStation: 3000,
  //   shops: 300,
  //   restaurant: 150
  // }
  
  // Contenu optimisé pour embedding
  searchableContent String?  @db.Text // Concaténation optimisée
  semanticTags      String[] @default([]) // Tags générés par IA
  
  // Vecteur d'embedding (1536 dimensions OpenAI)
  embedding         Float[]? 
  embeddingModel    String?  @default("text-embedding-3-small")
  embeddingDate     DateTime?
  
  // Règles et politiques
  rules            Json     @default("{}")
  // {
  //   checkIn: "15:00",
  //   checkOut: "11:00", 
  //   smoking: false,
  //   pets: false,
  //   parties: false,
  //   quietHours: "22:00-08:00"
  // }
  
  // Timestamps
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Relations
  tenant           Tenant            @relation(fields: [tenantId], references: [id])
  media            PropertyMedia[]
  rates            Rate[]
  bookings         Booking[]
  reviews          Review[]
  
  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([status])
  @@index([city, region])
  @@index([embedding(ops: VectorOps)]) // Index vectoriel
}

model PropertyMedia {
  id          String   @id @default(cuid())
  propertyId  String
  type        String   @default("image") // image, video, virtual_tour
  url         String   // URL S3
  thumbnail   String?  // URL version mini
  caption     String?
  order       Int      @default(0)
  
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  
  @@index([propertyId])
}

model Rate {
  id          String   @id @default(cuid())
  propertyId  String
  
  name        String   // "Été 2024", "Tarif de base"
  priority    Int      @default(0) // Plus élevé = prioritaire
  
  // Période
  startDate   DateTime?
  endDate     DateTime?
  isDefault   Boolean  @default(false)
  
  // Tarifs
  nightlyRate Decimal  @db.Decimal(10, 2)
  weeklyRate  Decimal? @db.Decimal(10, 2) // Réduction auto
  monthlyRate Decimal? @db.Decimal(10, 2)
  
  // Suppléments
  weekendRate Decimal? @db.Decimal(10, 2) // Vendredi/Samedi
  extraGuest  Decimal? @db.Decimal(10, 2) // Par pers supp
  
  // Contraintes
  minNights   Int      @default(1)
  maxNights   Int?
  
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  
  @@index([propertyId])
  @@index([startDate, endDate])
}

model Booking {
  id                    String   @id @default(cuid())
  tenantId              String
  propertyId            String
  
  // Référence unique
  reference             String   @unique // VIL-2024-XXXX
  
  // Dates
  checkIn               DateTime @db.Date
  checkOut              DateTime @db.Date
  nights                Int
  
  // Invités
  guestName             String
  guestEmail            String
  guestPhone            String?
  guestCountry          String?
  adults                Int
  children              Int      @default(0)
  infants               Int      @default(0)
  
  // Tarification
  nightlyRate           Decimal  @db.Decimal(10, 2)
  accommodationTotal    Decimal  @db.Decimal(10, 2)
  cleaningFee           Decimal  @default(0) @db.Decimal(10, 2)
  serviceFees           Decimal  @default(0) @db.Decimal(10, 2)
  taxes                 Decimal  @default(0) @db.Decimal(10, 2)
  totalAmount           Decimal  @db.Decimal(10, 2)
  
  // Paiement Stripe
  stripePaymentIntentId String?  @unique
  paymentStatus         String   @default("pending")
  paymentMethod         String?  // card, sepa, ...
  
  // Commission plateforme (si hub)
  platformFee           Decimal? @db.Decimal(10, 2)
  payoutAmount          Decimal? @db.Decimal(10, 2)
  
  // Source et tracking IA
  source                String   @default("direct") // direct, hub, airbnb
  searchQuery           String?  @db.Text // Requête IA originale
  searchSessionId       String?  // Pour analytics
  
  // Statut
  status                String   @default("pending")
  // pending, confirmed, paid, cancelled, completed
  
  // Messages
  specialRequests       String?  @db.Text
  internalNotes         String?  @db.Text
  
  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  paidAt                DateTime?
  cancelledAt           DateTime?
  
  // Relations
  tenant                Tenant   @relation(fields: [tenantId], references: [id])
  property              Property @relation(fields: [propertyId], references: [id])
  review                Review?
  
  @@index([tenantId])
  @@index([propertyId])
  @@index([checkIn, checkOut])
  @@index([reference])
  @@index([source])
}

// Logs pour apprentissage IA
model SearchQuery {
  id              String   @id @default(cuid())
  
  // Requête
  originalQuery   String   @db.Text // "villa balançoire près mer"
  language        String   @default("fr")
  
  // Parsing IA
  parsedIntent    Json     // Structure analysée par GPT
  embedding       Float[]? // Vecteur de la requête
  
  // Résultats
  returnedIds     String[] // Properties retournées
  clickedId       String?  // Property cliquée
  bookedId        String?  // Réservation finale
  
  // Métriques
  responseTime    Int      // ms
  relevanceScore  Float?   // Score IA
  
  // Session
  sessionId       String
  userId          String?
  
  createdAt       DateTime @default(now())
  
  @@index([sessionId])
  @@index([createdAt])
}
```

### 2.4 Infrastructure et DevOps

```yaml
# docker-compose.yml pour dev local
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - 5432:5432

  redis:
    image: redis:alpine
    ports:
      - 6379:6379

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - 9000:9000
      - 9001:9001
```

```bash
# Scripts package.json
{
  "scripts": {
    "dev": "pnpm --parallel dev",
    "dev:api": "cd apps/api && pnpm dev",
    "dev:dashboard": "cd apps/dashboard && pnpm dev",
    "dev:booking": "cd apps/booking && pnpm dev",
    "db:push": "cd packages/database && prisma db push",
    "db:seed": "cd packages/database && prisma db seed",
    "test": "pnpm --parallel test",
    "build": "pnpm --parallel build",
    "deploy": "pnpm build && pnpm deploy:api && pnpm deploy:apps"
  }
}
```

---

## 💰 3. SYSTÈME DE PAIEMENT STRIPE CONNECT

### 3.1 Architecture Stripe
```typescript
// Configuration Stripe par tenant
interface StripeConfig {
  accountId: string      // Compte Connect
  webhookSecret: string  // Par tenant
  feePercent: number    // Commission (0% direct, 10% hub)
}

// Flow de paiement
1. Client réserve sur site custom
2. PaymentIntent créé avec commission
3. Paiement capturé à la confirmation
4. Virement auto au propriétaire J+2
5. Commission reste sur compte plateforme
```

### 3.2 Onboarding Propriétaire
```typescript
// Étapes simplifiées
async function onboardOwner(tenantId: string) {
  // 1. Créer compte Express
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'FR',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    }
  });
  
  // 2. Générer lien onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${APP_URL}/settings/stripe`,
    return_url: `${APP_URL}/settings/stripe/success`,
    type: 'account_onboarding'
  });
  
  // 3. Sauvegarder en DB
  await updateTenant(tenantId, {
    stripeAccountId: account.id
  });
  
  return accountLink.url;
}
```

### 3.3 Gestion des Commissions
```typescript
// Commission automatique
const payment = await stripe.paymentIntents.create({
  amount: totalAmount * 100, // En centimes
  currency: 'eur',
  
  // Commission plateforme
  application_fee_amount: totalAmount * 0.10 * 100, // 10%
  
  // Virement au propriétaire
  transfer_data: {
    destination: tenant.stripeAccountId
  },
  
  // Métadonnées pour tracking
  metadata: {
    bookingId: booking.id,
    propertyId: property.id,
    source: 'direct' // ou 'hub'
  }
});
```

---

## 🎨 4. TEMPLATE SITE CUSTOM

### 4.1 Design System
```typescript
// Configuration du thème par tenant
interface TenantTheme {
  // Couleurs
  primary: string      // #3B82F6
  secondary: string    // #10B981
  accent: string       // #F59E0B
  
  // Typographie
  fontFamily: string   // 'Inter', 'Playfair Display'
  
  // Logo
  logo: string         // URL
  favicon: string      // URL
  
  // Options
  rounded: 'none' | 'sm' | 'md' | 'lg'
  style: 'modern' | 'classic' | 'minimal'
}
```

### 4.2 Structure du Template
```
Pages du site custom :
├── Homepage
│   ├── Hero avec recherche
│   ├── Propriétés featured
│   ├── Témoignages
│   └── À propos
├── Listing propriétés
│   ├── Filtres latéraux
│   ├── Carte interactive
│   └── Grille résultats
├── Détail propriété
│   ├── Galerie photos
│   ├── Description
│   ├── Équipements
│   ├── Calendrier dispo
│   ├── Tarifs
│   ├── Avis
│   └── Widget réservation
├── Processus réservation
│   ├── Étape 1: Dates/invités
│   ├── Étape 2: Options
│   ├── Étape 3: Infos client
│   └── Étape 4: Paiement
└── Pages légales
    ├── CGV
    ├── Mentions légales
    └── Confidentialité
```

### 4.3 Composants Réutilisables
```typescript
// packages/ui/components/booking/BookingWidget.tsx
interface BookingWidgetProps {
  property: Property
  rates: Rate[]
  onBook: (booking: BookingRequest) => void
}

export function BookingWidget({ property, rates, onBook }) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex justify-between">
          <span className="text-2xl font-bold">
            {calculatePrice()}€
          </span>
          <span className="text-muted">/ nuit</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <DateRangePicker />
        <GuestSelector />
        <PriceBreakdown />
      </CardContent>
      
      <CardFooter>
        <Button onClick={handleBooking} className="w-full">
          Réserver
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 📊 5. DASHBOARD PROPRIÉTAIRE

### 5.1 Fonctionnalités Core
```
Dashboard modules :
├── Vue d'ensemble
│   ├── KPIs (CA, taux, ADR)
│   ├── Calendrier du mois
│   ├── Dernières réservations
│   └── Actions rapides
├── Propriétés
│   ├── Liste/grille
│   ├── Création/édition
│   ├── Médias
│   ├── Tarifs
│   └── Disponibilités
├── Réservations
│   ├── Calendrier
│   ├── Liste
│   ├── Détails
│   └── Factures
├── Clients
│   ├── Base données
│   ├── Historique
│   └── Communications
├── Finances
│   ├── Revenus
│   ├── Commissions
│   ├── Virements
│   └── Exports
└── Paramètres
    ├── Compte
    ├── Site web
    ├── Stripe
    └── Équipe
```

### 5.2 Analytics Temps Réel
```typescript
// Métriques clés affichées
interface DashboardMetrics {
  // Période courante
  revenue: number
  bookings: number
  occupancyRate: number
  averageDailyRate: number
  
  // Comparaison
  revenueChange: number // % vs période précédente
  bookingsChange: number
  
  // Prévisions
  projectedRevenue: number // Mois en cours
  upcomingCheckIns: number
  
  // Performance
  conversionRate: number
  averageStayLength: number
}
```

---

## 🤖 6. PRÉPARATION RECHERCHE IA

### 6.1 Pipeline de Données
```typescript
// Service de préparation des embeddings
class PropertyEmbeddingService {
  async generateSearchableContent(property: Property): string {
    // Concaténer les infos pertinentes
    const parts = [
      property.name,
      property.description.fr,
      property.type,
      `${property.bedrooms} chambres`,
      `${property.maxGuests} personnes`,
      property.city,
      
      // Amenities en langage naturel
      ...this.amenitiesDescription(property.amenities),
      
      // Proximités
      ...this.proximityDescription(property.proximity),
      
      // Atmosphère
      ...this.atmosphereDescription(property.atmosphere)
    ];
    
    return parts.join(' ').toLowerCase();
  }
  
  async generateEmbedding(content: string): Float32Array {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    });
    
    return new Float32Array(response.data[0].embedding);
  }
}
```

### 6.2 Indexation Automatique
```typescript
// Job d'indexation quotidien
async function indexPropertiesForAI() {
  const properties = await prisma.property.findMany({
    where: { 
      status: 'active',
      OR: [
        { embedding: null },
        { embeddingDate: { lt: lastWeek } }
      ]
    }
  });
  
  for (const property of properties) {
    // Générer contenu optimisé
    const content = await generateSearchableContent(property);
    
    // Créer embedding
    const embedding = await generateEmbedding(content);
    
    // Sauvegarder
    await prisma.property.update({
      where: { id: property.id },
      data: {
        searchableContent: content,
        embedding: Array.from(embedding),
        embeddingDate: new Date()
      }
    });
  }
}
```

### 6.3 Collecte de Données pour Apprentissage
```typescript
// Logger toutes les recherches pour futur ML
async function logSearch(query: string, results: Property[], clicked?: string) {
  await prisma.searchQuery.create({
    data: {
      originalQuery: query,
      language: detectLanguage(query),
      returnedIds: results.map(r => r.id),
      clickedId: clicked,
      sessionId: getSessionId(),
      responseTime: Date.now() - startTime
    }
  });
}
```

---

## 🚀 7. PLAN DE DÉVELOPPEMENT DÉTAILLÉ

### Phase 1 : Infrastructure (Semaines 1-2)

#### Sprint 1.1 : Setup Technique
```
□ Monorepo pnpm workspaces
□ Backend Fastify + TypeScript
□ Database PostgreSQL + pgvector
□ Prisma setup + migrations
□ Docker compose local
□ Git + CI/CD basique
```

#### Sprint 1.2 : Auth & Multi-tenant
```
□ JWT auth + refresh tokens
□ Middleware tenant isolation
□ Tenant creation flow
□ User management
□ Password reset
□ Session management
```

### Phase 2 : Sites Custom (Semaines 3-6)

#### Sprint 2.1 : Template de Base
```
□ Next.js SSG setup
□ Homepage responsive
□ Listing propriétés
□ Page détail propriété
□ Galerie photos
□ SEO optimisation
```

#### Sprint 2.2 : Widget Réservation
```
□ Calendrier disponibilités
□ Sélecteur dates/invités
□ Calcul prix temps réel
□ Formulaire réservation
□ Email confirmation
□ Page confirmation
```

#### Sprint 2.3 : Personnalisation
```
□ Thème configurable
□ Multi-domaine
□ Pages légales
□ Contact form
□ Newsletter
□ Analytics
```

### Phase 3 : Dashboard Admin (Semaines 7-10)

#### Sprint 3.1 : Gestion Propriétés
```
□ CRUD propriétés
□ Upload médias S3
□ Drag & drop images
□ Éditeur description
□ Gestion amenities
□ Preview site
```

#### Sprint 3.2 : Système de Tarification
```
□ Périodes tarifaires
□ Tarifs flexibles
□ Contraintes séjour
□ Calendrier prix
□ Import/export
□ Promotions
```

#### Sprint 3.3 : Gestion Réservations
```
□ Calendrier unifié
□ Liste réservations
□ Détails booking
□ Emails auto
□ Exports CSV
□ Statistiques
```

### Phase 4 : Paiements (Semaines 11-12)

#### Sprint 4.1 : Stripe Connect
```
□ Onboarding flow
□ Dashboard Stripe
□ Webhooks
□ Paiements sécurisés
□ Remboursements
□ Factures PDF
```

#### Sprint 4.2 : Optimisation
```
□ Tests complets
□ Monitoring
□ Performance
□ Sécurité
□ Documentation
□ Formation clients
```

### Phase 5 : Lancement Public (Semaines 13-16)

#### Sprint 5.1 : Hub Central
```
□ Homepage hub
□ Moteur recherche
□ Filtres avancés
□ Carte interactive
□ Comptes voyageurs
□ Favoris
```

#### Sprint 5.2 : Recherche IA
```
□ Interface langage naturel
□ Parsing GPT-4
□ Recherche vectorielle
□ Ranking intelligent
□ Apprentissage continu
□ Analytics IA
```

---

## 💰 8. MODÈLE ÉCONOMIQUE

### 8.1 Pricing SaaS B2B
```
Starter - 49€/mois
✓ 1 propriété
✓ Site web personnalisé
✓ Réservations illimitées
✓ Paiements Stripe
✓ Support email

Professional - 99€/mois
✓ 5 propriétés
✓ Domaine personnalisé
✓ Multi-tarifs
✓ API calendrier
✓ Support prioritaire

Scale - 199€/mois
✓ Propriétés illimitées
✓ Multi-utilisateurs
✓ API complète
✓ Onboarding dédié
✓ Account manager
```

### 8.2 Commissions Hub (Phase 2)
- **Réservations directes** : 0% (valeur ajoutée SaaS)
- **Réservations hub** : 10% (compétitif vs 15-20%)
- **Services premium** : 5% additionnels

### 8.3 Projections Financières
| Mois | Clients | MRR SaaS | Commissions | Total MRR | Coûts | Profit |
|------|---------|----------|-------------|-----------|-------|--------|
| 2 | 10 | 490€ | 0€ | 490€ | 200€ | 290€ |
| 4 | 50 | 2,450€ | 0€ | 2,450€ | 500€ | 1,950€ |
| 6 | 150 | 7,350€ | 2,000€ | 9,350€ | 1,500€ | 7,850€ |
| 12 | 500 | 24,500€ | 15,000€ | 39,500€ | 5,000€ | 34,500€ |

---

## 🎯 9. FACTEURS CLÉS DE SUCCÈS

### 9.1 Avantages Concurrentiels
1. **Sites custom performants** : 10x plus rapides que WordPress
2. **Onboarding 15 minutes** : Vs plusieurs jours ailleurs
3. **Commission 0% en direct** : Unique sur le marché
4. **IA révolutionnaire** : 2 ans d'avance (Phase 2)
5. **Support FR réactif** : Réponse < 2h

### 9.2 Métriques de Succès
```typescript
const kpis = {
  acquisition: {
    signups: 50/mois,
    conversion: 20%, // trial → paid
    cac: 100€,
    payback: 2 mois
  },
  
  product: {
    setupTime: '< 15 min',
    uptime: '99.9%',
    pageSpeed: '< 1s',
    nps: 70+
  },
  
  business: {
    mrr: 25000€, // 12 mois
    churn: '< 5%',
    ltv: 2000€,
    margin: 85%
  }
};
```

### 9.3 Roadmap Post-Lancement
- **Mois 13-15** : Intégrations (Airbnb, Booking)
- **Mois 16-18** : App mobile propriétaires
- **Mois 19-21** : Expansion européenne
- **Mois 22-24** : API publique + Marketplace

---

## 📋 10. CHECKLIST TECHNIQUE

### 10.1 Avant de Coder
```
□ Compte AWS (S3, SES)
□ Compte Stripe
□ Compte Vercel
□ Domaine principal
□ SSL wildcard
□ GitHub repo
□ Figma maquettes
```

### 10.2 Semaine 1
```
□ Setup monorepo
□ Config TypeScript
□ Prisma + migrations
□ Auth JWT
□ Tests unitaires
□ Docker local
□ CI/CD GitHub Actions
```

### 10.3 MVP (Mois 2)
```
□ 1 site custom live
□ Dashboard fonctionnel
□ Réservations actives
□ Emails automatiques
□ Monitoring erreurs
□ Backup quotidien
□ Documentation
```

---

## 🚨 11. GESTION DES RISQUES

### 11.1 Risques Techniques
| Risque | Impact | Mitigation |
|--------|---------|------------|
| Performance | Élevé | CDN + Cache agressif |
| Sécurité | Critique | Audit + WAF |
| Scalabilité | Moyen | Architecture cloud-native |
| SEO | Élevé | SSG + Schema.org |

### 11.2 Risques Business
| Risque | Impact | Mitigation |
|--------|---------|------------|
| Adoption lente | Élevé | 1 mois gratuit + onboarding |
| Concurrence | Moyen | Focus innovation IA |
| Réglementation | Moyen | Veille juridique |
| Support | Moyen | FAQ + Chatbot |

---

## 🎉 12. CONCLUSION

### Vision Finale
**"La première plateforme qui permet aux propriétaires de locations saisonnières d'avoir un site professionnel en 15 minutes, avec une recherche IA révolutionnaire pour les voyageurs"**

### Prochaines Actions
1. **Semaine 1** : Setup technique complet
2. **Semaine 2** : Auth multi-tenant
3. **Semaine 3** : Premier site custom
4. **Semaine 4** : Widget réservation
5. **Mois 2** : 10 premiers clients

### Facteur X
La combinaison unique de :
- Sites custom ultra-rapides
- Paiements automatisés
- Future recherche IA
- Support exceptionnel

**Objectif ultime : 1000 propriétaires actifs en 18 mois**