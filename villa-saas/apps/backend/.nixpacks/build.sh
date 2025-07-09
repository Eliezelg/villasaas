#!/bin/bash
# Script de build pour Nixpacks

echo "🚀 Building Villa SaaS Backend..."

# Installation des dépendances
echo "📦 Installing dependencies..."
npm ci --production=false

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build completed!"