#!/bin/bash

echo "🧹 Nettoyage complet..."

# Supprimer tous les node_modules et lock files
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null
find . -name "package-lock.json" -type f -delete 2>/dev/null
find . -name "pnpm-lock.yaml" -type f -delete 2>/dev/null
find . -name ".pnpm-store" -type d -prune -exec rm -rf {} + 2>/dev/null

# Nettoyer le cache npm
npm cache clean --force

echo "📦 Installation propre..."

# Installer Prisma d'abord
cd packages/database
npm install --no-save prisma @prisma/client
npm install --save-dev --no-save tsx bcryptjs @types/bcryptjs
cd ../..

# Générer Prisma
cd packages/database
npx prisma generate
cd ../..

# Installer le reste
cd packages/utils
npm install --no-save
cd ../..

cd packages/types  
npm install --no-save
cd ../..

cd packages/ui
npm install --no-save
cd ../..

cd apps/backend
npm install --no-save
cd ../..

cd apps/web
npm install --no-save --legacy-peer-deps
cd ../..

echo "✅ Installation terminée!"