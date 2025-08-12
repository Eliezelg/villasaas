#!/bin/bash

echo "🚀 Démarrage du backend Villa SaaS..."

# Vérifier PostgreSQL
echo "🐳 Vérification de PostgreSQL..."
if ! docker ps | grep -q villa_postgres; then
  echo "⚠️  PostgreSQL n'est pas démarré. Démarrage..."
  cd .. && docker-compose up -d && cd villa-saas
  sleep 5
fi

# Installer les dépendances manquantes
echo "📦 Installation des dépendances..."
cd apps/backend
npm install dotenv tsx @prisma/client
cd ../..

# Exporter DATABASE_URL pour Prisma
export DATABASE_URL="postgresql://villa_user:villa_password@localhost:5433/villa_saas?schema=public"

# Générer Prisma
echo "🔧 Génération du client Prisma..."
cd packages/database
npx prisma generate
cd ../..

# Push du schéma
echo "💾 Mise à jour de la base de données..."
cd packages/database
DATABASE_URL="postgresql://villa_user:villa_password@localhost:5433/villa_saas?schema=public" npx prisma db push --skip-generate
cd ../..

# Démarrer le backend
echo "🎯 Démarrage du backend sur http://api.webpro200.com"
cd apps/backend
npm run dev