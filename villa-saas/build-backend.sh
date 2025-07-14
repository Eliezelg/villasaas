#!/bin/bash
set -e

echo "🚀 Building Villa SaaS Backend..."

# Check if we're already in villa-saas directory
if [ -d "villa-saas" ]; then
    echo "📂 Navigating to villa-saas directory..."
    cd villa-saas
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔨 Generating Prisma client..."
cd packages/database
npx prisma generate

# Build database package
echo "📦 Building @villa-saas/database..."
npm run build
cd ..

# Build utils package
echo "📦 Building @villa-saas/utils..."
cd utils
npm run build
cd ..

# Build types package
echo "📦 Building @villa-saas/types..."
cd types
npm run build
cd ..

# Build i18n package
echo "📦 Building @villa-saas/i18n..."
cd i18n
npm run build
cd ../..

# Build backend
echo "🏗️ Building backend..."
cd apps/backend
npm run build

echo "✅ Build complete!"