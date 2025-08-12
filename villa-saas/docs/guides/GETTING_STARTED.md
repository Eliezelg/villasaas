# Getting Started with Villa SaaS

This guide will help you set up and run Villa SaaS on your local development environment.

## 📋 Prerequisites

- Node.js 20+ (LTS recommended)
- Docker and Docker Compose
- Git
- A code editor (VS Code recommended)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd villa-saas
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/villa_saas?schema=public"
JWT_SECRET="your-secret-key-here"
REFRESH_SECRET="your-refresh-secret-here"
REDIS_URL="redis://localhost:6379"
```

### 4. Start Infrastructure Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis cache
- pgAdmin (optional, for database management)

### 5. Set Up the Database
```bash
./scripts/update-db.sh
```

This script:
- Pushes the Prisma schema to the database
- Generates the Prisma client
- Seeds initial data (if configured)

### 6. Start Development Servers

#### Backend (in `apps/backend` directory):
```bash
cd apps/backend
npm run dev
```

The API will be available at: `http://api.webpro200.com`

#### Frontend (in `apps/web` directory):
```bash
cd apps/web
npm run dev
```

The web app will be available at: `http://localhost:3000`

## 🏗️ Project Structure

```
villa-saas/
├── apps/
│   ├── backend/      # Fastify API server
│   └── web/          # Next.js dashboard
├── packages/
│   ├── database/     # Prisma schema and migrations
│   ├── types/        # Shared TypeScript types
│   └── utils/        # Shared utilities
├── docs/             # All documentation
└── docker-compose.yml
```

## 🔑 First Login

1. Register a new account at: `http://localhost:3000/register`
2. This creates:
   - Your admin user account
   - A new tenant (organization)
   - Full access to all features

## 🛠️ Development Commands

### Database Management
```bash
# Update database schema
./scripts/update-db.sh

# Open Prisma Studio
cd packages/database && npm run db:studio

# Generate new migration
cd packages/database && npx prisma migrate dev --name your-migration-name
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.spec.ts
```

### Building
```bash
# Build all packages
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📚 Key Documentation

Before developing, read:
1. [Development Guidelines](./DEVELOPMENT_GUIDELINES.md) - Critical patterns and rules
2. [Backend Architecture](../architecture/BACKEND_ARCHITECTURE.md) - API structure
3. [API Documentation](../api/API_DOCUMENTATION.md) - Endpoint reference

## 🔧 Common Issues

### Port Already in Use
If ports 3000 or 3001 are already in use:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues
1. Ensure Docker is running: `docker ps`
2. Check database logs: `docker logs villa-saas-postgres-1`
3. Verify DATABASE_URL in `.env.local`

### Module Resolution Issues
If you see "Cannot find module" errors:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Next Steps

1. **Explore the Dashboard**: Log in and familiarize yourself with the features
2. **Create a Property**: Add your first vacation rental property
3. **Set Up Pricing**: Configure pricing periods and rules
4. **Test Bookings**: Create test bookings to understand the flow

## 📞 Getting Help

- Check the [Development Guidelines](./DEVELOPMENT_GUIDELINES.md)
- Review the [API Documentation](../api/API_DOCUMENTATION.md)
- Look for similar issues in the [Fixes Summary](../development/FIXES_SUMMARY.md)

Happy coding! 🚀