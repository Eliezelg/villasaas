# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Villa SaaS - A multi-tenant vacation rental management platform currently in planning phase. The project consists of three main applications:
- **Booking sites**: Public-facing booking websites with custom domains per property owner
- **Dashboard**: Admin interface for property owners to manage listings
- **Hub**: Future AI-powered marketplace for travelers

## Development Commands

```bash
# Initial Setup
pnpm install
cp .env.example .env.local
docker-compose up -d postgres redis
pnpm db:push
pnpm db:seed

# Development
pnpm dev              # Run all apps in parallel
pnpm dev:api         # Backend API only
pnpm dev:dashboard   # Admin dashboard only
pnpm dev:booking     # Booking site only

# Testing
pnpm test            # All tests
pnpm test:unit       # Unit tests only
pnpm test:e2e        # E2E tests

# Database
pnpm db:push         # Push schema changes
pnpm db:seed         # Seed test data

# Build & Deploy
pnpm build           # Build all apps
pnpm deploy          # Build and deploy
```

## Architecture

### Project Structure
```
villa-saas/
├── apps/
│   ├── api/          # Fastify backend
│   ├── booking/      # Next.js booking sites
│   ├── dashboard/    # Next.js admin
│   └── hub/          # Future marketplace
├── packages/
│   ├── database/     # Prisma schema + types
│   ├── ui/          # Shared components
│   ├── utils/       # Helper functions
│   └── types/       # Shared TypeScript types
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

Project is in planning phase with comprehensive documentation in `/docs`:
- `cahier-charges-villa-saas-v2.md`: Business requirements and technical specifications
- `villa-saas-dev-guide.md`: Developer guide and best practices
- `villa-saas-fonctionnalites-detaillees.md`: Detailed functional specifications

No code implementation has begun yet. When starting development, create the monorepo structure and follow the patterns documented above.