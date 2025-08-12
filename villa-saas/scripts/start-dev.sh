#!/bin/bash

echo "🚀 Démarrage de Villa SaaS..."

# Vérifier Docker
echo "🐳 Vérification des services Docker..."
cd ..
docker-compose ps
docker-compose up -d
cd villa-saas

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
sleep 5

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
cd packages/database
npx prisma generate
cd ../..

# Initialiser la base de données si nécessaire
echo "💾 Initialisation de la base de données..."
cd packages/database
npx prisma db push --skip-generate
cd ../..

# Démarrer les applications
echo "🎯 Démarrage des applications..."
echo ""
echo "Backend: http://api.webpro200.com"
echo "Frontend: http://localhost:3000"
echo ""

# Démarrer en parallèle
cd apps/backend && npm run dev &
BACKEND_PID=$!

cd ../web && npm run dev &
FRONTEND_PID=$!

echo "✅ Applications démarrées!"
echo "Appuyez sur Ctrl+C pour arrêter"

# Attendre et nettoyer à la sortie
wait $BACKEND_PID $FRONTEND_PID