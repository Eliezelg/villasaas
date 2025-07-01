#!/bin/bash

echo "🚀 Installation de Villa SaaS..."

# Nettoyer les anciennes installations
echo "🧹 Nettoyage..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null
find . -name "package-lock.json" -type f -delete 2>/dev/null
find . -name "pnpm-lock.yaml" -type f -delete 2>/dev/null

# Installer les packages dans l'ordre
echo "📦 Installation des packages..."

echo "  → database"
cd packages/database
npm install --no-save @prisma/client prisma
cd ../..

echo "  → utils"
cd packages/utils
npm install --no-save argon2 date-fns
npm install --save-dev --no-save typescript @types/node
cd ../..

echo "  → types"
cd packages/types
npm install --save-dev --no-save typescript
cd ../..

echo "  → ui"
cd packages/ui
npm install --save-dev --no-save typescript react @types/react
cd ../..

echo "  → backend"
cd apps/backend
npm install --no-save
cd ../..

echo "  → web"
cd apps/web
npm install --no-save
cd ../..

echo "✅ Installation terminée!"
echo ""
echo "Pour démarrer le projet:"
echo "  1. docker-compose up -d (pour PostgreSQL et Redis)"
echo "  2. npm run db:push (initialiser la base de données)"
echo "  3. npm run dev (démarrer l'application)"