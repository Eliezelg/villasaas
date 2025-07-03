#!/bin/bash

echo "🔄 Mise à jour de la base de données..."

# Définir DATABASE_URL
export DATABASE_URL="postgresql://villa_user:villa_password@localhost:5433/villa_saas?schema=public"

# Aller dans le package database
cd packages/database

# Générer le client Prisma
echo "📦 Génération du client Prisma..."
npx prisma generate

# Appliquer les changements à la base de données
echo "💾 Application des changements..."
npx prisma db push --skip-generate

echo "✅ Base de données mise à jour!"

cd ../..