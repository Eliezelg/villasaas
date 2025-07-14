#!/bin/bash
set -e

echo "🚀 Building Villa SaaS for Railway..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
cd packages/database
npx prisma generate
cd ../..

# Build packages
echo "🔨 Building packages..."
cd packages/database && npm run build && cd ../..
cd packages/utils && npm run build && cd ../..
cd packages/types && npm run build && cd ../..
cd packages/i18n && npm run build && cd ../..

# Build backend
echo "🏗️ Building backend..."
cd apps/backend && npm run build && cd ../..

echo "✅ Build complete!"