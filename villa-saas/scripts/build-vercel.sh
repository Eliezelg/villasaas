#!/bin/bash
set -e

echo "🚀 Building Villa SaaS Unified App for Vercel..."

# Install all dependencies at root
echo "📦 Installing root dependencies..."
npm ci

# Generate Prisma client
echo "🔄 Generating Prisma client..."
cd packages/database
npx prisma generate
cd ../..

# Install unified app dependencies
echo "📦 Installing unified app dependencies..."
cd apps/unified
npm ci

# Build the app
echo "🏗️ Building unified app..."
npm run build

echo "✅ Build complete!"