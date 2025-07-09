#!/bin/bash

echo "🚀 Configuration Supabase pour Villa SaaS"
echo "========================================"

# Vérifier si on a le mot de passe DB
if [ -z "$1" ]; then
    echo "❌ Usage: ./setup-supabase.sh [DATABASE_PASSWORD]"
    echo "Trouvez le mot de passe dans Supabase Dashboard > Settings > Database"
    exit 1
fi

DB_PASSWORD=$1

# Mettre à jour le fichier .env pour Prisma
echo "📝 Configuration de la base de données..."
cd packages/database

# Créer le .env si il n'existe pas
if [ ! -f .env ]; then
    echo "DATABASE_URL=\"postgresql://postgres.gcswwlhvuymhlzdbgbbh:${DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres\"" > .env
else
    echo "⚠️  .env existe déjà dans packages/database - mise à jour manuelle nécessaire"
fi

# Pousser le schema
echo "🔄 Migration du schema Prisma..."
npx prisma db push

echo "✅ Configuration Supabase terminée!"
echo ""
echo "Prochaines étapes:"
echo "1. Dans Supabase SQL Editor, exécuter: CREATE EXTENSION IF NOT EXISTS vector;"
echo "2. Mettre à jour apps/backend/.env.production avec le mot de passe DB"
echo "3. Tester avec: npm run db:studio"