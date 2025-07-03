# Villa SaaS System Architecture

## Overview

Villa SaaS is built as a modern, scalable multi-tenant SaaS platform using a monorepo architecture. The system is designed to handle thousands of property owners managing their vacation rentals.

## 🏗️ High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Web Browser   │────▶│  Next.js App    │────▶│  Fastify API    │
│                 │     │   (Frontend)    │     │   (Backend)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                        ┌─────────────────┬───────────────┴───────────────┐
                        │                 │                               │
                        ▼                 ▼                               ▼
                ┌─────────────┐   ┌─────────────┐               ┌─────────────┐
                │ PostgreSQL  │   │    Redis    │               │   Storage   │
                │  Database   │   │    Cache    │               │   (Local)   │
                └─────────────┘   └─────────────┘               └─────────────┘
```

## 🏛️ Architectural Patterns

### 1. Monorepo Structure
Using npm workspaces for code organization:
- **Shared packages** for common functionality
- **Independent apps** that can be deployed separately
- **Centralized configuration** and tooling

### 2. Multi-Tenancy
Data isolation at the application level:
- Every database query includes `tenantId`
- Middleware validates tenant access
- Complete data isolation between organizations

### 3. API-First Design
RESTful API with OpenAPI documentation:
- Clear separation of concerns
- Frontend agnostic backend
- Standardized API contracts

### 4. Layered Architecture
Each module follows a consistent structure:
```
Controller (Routes) → Service (Business Logic) → Repository (Data Access)
```

## 📦 Component Architecture

### Backend (Fastify API)

```
apps/backend/
├── src/
│   ├── plugins/          # Fastify plugins
│   │   ├── auth.ts      # JWT authentication
│   │   ├── cors.ts      # CORS configuration
│   │   ├── multipart.ts # File uploads
│   │   └── prisma.ts    # Database client
│   │
│   ├── modules/         # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── properties/  # Property management
│   │   ├── bookings/    # Reservation system
│   │   ├── pricing/     # Dynamic pricing
│   │   └── analytics/   # Reporting
│   │
│   ├── utils/           # Shared utilities
│   └── app.ts          # Application entry
```

### Frontend (Next.js)

```
apps/web/
├── src/
│   ├── app/            # App Router pages
│   │   ├── (auth)/     # Auth pages
│   │   └── dashboard/  # Protected pages
│   │
│   ├── components/     # React components
│   │   ├── ui/        # Base UI components
│   │   ├── forms/     # Form components
│   │   └── layouts/   # Layout components
│   │
│   ├── services/      # API services
│   ├── hooks/         # Custom React hooks
│   └── lib/          # Utilities
```

### Shared Packages

```
packages/
├── database/         # Prisma schema & client
├── types/           # TypeScript types
└── utils/          # Shared utilities
```

## 🔐 Security Architecture

### Authentication Flow
```
┌──────────┐  Login   ┌──────────┐  Validate  ┌──────────┐
│  Client  │─────────▶│   API    │──────────▶│   Auth   │
└──────────┘          └──────────┘            │ Service  │
     ▲                      │                  └──────────┘
     │                      │                        │
     │   Access Token       │                        │
     │   Refresh Token      │                        ▼
     └──────────────────────┴──────────────────[JWT Tokens]
```

### Security Layers
1. **JWT Authentication** - Stateless token-based auth
2. **Refresh Tokens** - Secure token rotation
3. **Multi-Tenancy** - Data isolation per organization
4. **Input Validation** - Zod schemas on all inputs
5. **Rate Limiting** - DDoS protection
6. **CORS** - Configured origins only

## 💾 Data Architecture

### Database Schema Overview
```sql
-- Core entities with multi-tenancy
Tenant ─┬─── User
        ├─── Property ─┬─── PropertyImage
        │              ├─── PricingPeriod
        │              └─── BlockedPeriod
        └─── Booking ───── Payment
```

### Caching Strategy
- **Redis** for session storage
- **Query caching** for frequently accessed data
- **CDN** for static assets (future)

### File Storage
- Local filesystem during development
- Cloud storage (S3/GCS) for production
- Image optimization on upload
- Multiple sizes generated

## 🚀 Deployment Architecture

### Development
```
Docker Compose
├── PostgreSQL (port 5432)
├── Redis (port 6379)
└── pgAdmin (port 5050)
```

### Production (Recommended)
```
┌─────────────────┐
│   CloudFlare    │
│      (CDN)      │
└────────┬────────┘
         │
┌────────▼────────┐     ┌─────────────────┐
│     Vercel      │────▶│     Railway     │
│   (Frontend)    │     │    (Backend)    │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                  ┌─────▼─────┐    ┌─────▼─────┐
                  │PostgreSQL │    │   Redis   │
                  │    RDS     │    │  Cluster  │
                  └───────────┘    └───────────┘
```

## 📊 Performance Considerations

### Backend Optimization
- **Connection pooling** for database
- **Lazy loading** of modules
- **Streaming** for large responses
- **Compression** enabled

### Frontend Optimization
- **SSR/SSG** with Next.js
- **Code splitting** automatic
- **Image optimization** built-in
- **Edge caching** with ISR

### Database Optimization
- **Indexes** on foreign keys and search fields
- **Compound indexes** for complex queries
- **Partial indexes** for filtered queries
- **Query optimization** with Prisma

## 🔄 Scalability Design

### Horizontal Scaling
- Stateless API servers
- Load balancer ready
- Database read replicas
- Redis cluster support

### Vertical Scaling
- Optimized queries
- Efficient caching
- Resource monitoring
- Performance profiling

## 🎯 Future Architecture (Phase 3)

### Multi-Site Support
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Domain A   │────▶│             │────▶│             │
└─────────────┘     │    Edge     │     │     API     │
┌─────────────┐     │   Router    │     │   Gateway   │
│  Domain B   │────▶│             │────▶│             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Microservices Evolution
- Booking Service
- Payment Service
- Notification Service
- Analytics Service

## 📈 Monitoring & Observability

### Application Monitoring
- Error tracking (Sentry)
- Performance monitoring (APM)
- Custom metrics
- Health checks

### Infrastructure Monitoring
- Server metrics
- Database performance
- Cache hit rates
- API response times

## 🔗 Integration Points

### Current Integrations
- OpenStreetMap (Geocoding)
- Sharp (Image processing)
- Stripe (Payments - planned)

### Future Integrations
- Email providers (SendGrid)
- SMS providers (Twilio)
- Analytics (Google Analytics)
- CDN providers (CloudFlare)

## 📚 Key Design Decisions

1. **Monorepo** - Simplified dependency management
2. **TypeScript** - Type safety across the stack
3. **Fastify** - High-performance API framework
4. **Next.js 14** - Modern React with App Router
5. **Prisma** - Type-safe database access
6. **JWT Auth** - Stateless authentication
7. **Multi-tenancy** - Scalable SaaS architecture

## 🛡️ Compliance & Standards

- **GDPR** - Data privacy compliance
- **PCI DSS** - Payment card standards (via Stripe)
- **WCAG** - Accessibility standards
- **ISO 27001** - Security best practices (planned)