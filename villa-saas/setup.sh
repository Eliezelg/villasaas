#!/bin/bash

echo "🚀 Configuration de Villa SaaS..."

# Installer les dépendances pour chaque package
echo "📦 Installation des dépendances..."

echo "  → packages/database"
cd packages/database
npm install prisma @prisma/client bcryptjs
npm install --save-dev @types/bcryptjs typescript
npx prisma generate
cd ../..

echo "  → packages/utils"
cd packages/utils
npm install bcryptjs date-fns
npm install --save-dev @types/bcryptjs @types/node typescript
cd ../..

echo "  → packages/types"
cd packages/types
npm install --save-dev typescript
cd ../..

echo "  → packages/ui"
cd packages/ui
npm install --save-dev typescript react @types/react
cd ../..

echo "  → apps/backend"
cd apps/backend
npm install @fastify/cors @fastify/helmet @fastify/jwt @fastify/rate-limit \
  fastify fastify-plugin ioredis pino pino-pretty zod dotenv
npm install --save-dev @types/node @types/jest typescript tsx \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint jest ts-jest
cd ../..

echo "  → apps/web"
cd apps/web
npm install
cd ../..

echo "✅ Installation terminée!"
echo ""
echo "Pour démarrer:"
echo "  1. ./start-backend.sh  (dans un terminal)"
echo "  2. ./start-frontend.sh (dans un autre terminal)"