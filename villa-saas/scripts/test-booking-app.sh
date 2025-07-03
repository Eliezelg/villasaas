#!/bin/bash

# Script pour tester l'app booking

echo "🧪 Test de l'application booking..."

# Test 1: Récupérer les infos du tenant
echo -e "\n1. Test récupération tenant par domaine..."
curl -s "http://localhost:3001/api/public/tenant-by-domain/demo.localhost:3002" | jq .

# Test 2: Récupérer les infos du tenant par subdomain
echo -e "\n2. Test récupération tenant par subdomain..."
curl -s "http://localhost:3001/api/public/tenant/demo" | jq .

# Test 3: Lister les propriétés publiques
echo -e "\n3. Test liste des propriétés..."
curl -s -H "X-Tenant: demo" "http://localhost:3001/api/public/properties" | jq .

echo -e "\n✅ Tests terminés"
echo -e "\n🌐 Pour tester l'interface:"
echo "   - Ouvrir http://demo.localhost:3002"
echo "   - Le tenant 'demo' devrait être détecté automatiquement"