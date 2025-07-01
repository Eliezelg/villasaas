#!/bin/bash

echo "🚀 Démarrage du backend Villa SaaS..."

# Vérifier PostgreSQL
echo "🐳 Vérification de PostgreSQL..."
if ! docker ps | grep -q villa_postgres; then
  echo "⚠️  PostgreSQL n'est pas démarré. Démarrage..."
  cd .. && docker-compose up -d && cd villa-saas
  sleep 5
fi

# Générer Prisma si nécessaire
echo "🔧 Génération du client Prisma..."
cd packages/database
npx prisma generate
cd ../..

# Push du schéma si nécessaire
echo "💾 Mise à jour de la base de données..."
cd packages/database
npx prisma db push --skip-generate
cd ../..

# Démarrer le backend
echo "🎯 Démarrage du backend sur http://localhost:3001"
cd apps/backend
npm run dev