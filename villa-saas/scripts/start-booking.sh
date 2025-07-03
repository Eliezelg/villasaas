#!/bin/bash

# Script pour démarrer l'app booking

echo "🚀 Démarrage de l'app booking..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -d "apps/booking" ]; then
  echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
  exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "apps/booking/node_modules" ]; then
  echo "📦 Installation des dépendances..."
  cd apps/booking && npm install && cd ../..
fi

# Démarrer l'app booking
echo "🌐 L'app booking sera accessible sur http://localhost:3002"
echo "💡 Pour tester avec un sous-domaine: http://demo.localhost:3002"
echo ""

cd apps/booking && npm run dev