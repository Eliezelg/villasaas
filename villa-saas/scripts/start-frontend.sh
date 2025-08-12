#!/bin/bash

echo "🚀 Démarrage du frontend Villa SaaS..."

# Vérifier que le backend est démarré
echo "🔍 Vérification du backend..."
if ! curl -s http://api.webpro200.com/health > /dev/null; then
  echo "⚠️  Le backend n'est pas accessible sur http://api.webpro200.com"
  echo "    Assurez-vous de démarrer le backend d'abord avec ./start-backend.sh"
fi

# Démarrer le frontend
echo "🎯 Démarrage du frontend sur http://localhost:3000"
cd apps/web
npm run dev