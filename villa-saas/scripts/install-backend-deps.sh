#!/bin/bash

echo "📦 Installation complète des dépendances backend..."

cd apps/backend

# Dépendances principales
echo "  → Installation des dépendances principales..."
npm install \
  fastify \
  @fastify/cors \
  @fastify/helmet \
  @fastify/jwt \
  @fastify/rate-limit \
  fastify-plugin \
  dotenv \
  ioredis \
  pino \
  pino-pretty \
  zod \
  bcryptjs

# Dépendances de développement
echo "  → Installation des dépendances de développement..."
npm install --save-dev \
  @types/node \
  @types/bcryptjs \
  typescript \
  tsx \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint \
  @types/jest \
  jest \
  ts-jest

# Installer les packages locaux
echo "  → Lien vers les packages locaux..."
npm install ../../packages/database
npm install ../../packages/types
npm install ../../packages/utils

cd ../..

echo "✅ Installation terminée!"