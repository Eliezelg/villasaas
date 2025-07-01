#!/bin/bash
echo "Génération du client Prisma..."
cd /home/eli/Documents/Villacustom/backend

# Installer les bonnes versions de Prisma
echo "Installation de Prisma 5.8.1..."
npm install --save-dev prisma@5.8.1
npm install @prisma/client@5.8.1

# Générer le client
echo "Génération du client..."
./node_modules/.bin/prisma generate

echo "✅ Client Prisma généré !"