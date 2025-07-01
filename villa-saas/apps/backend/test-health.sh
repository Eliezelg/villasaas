#!/bin/bash

echo "⏳ Test du serveur backend..."
sleep 2

# Test simple avec curl
response=$(curl -s -w "\n%{http_code}" http://localhost:3001/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo "✅ Serveur actif !"
    echo "Response: $body"
else
    echo "❌ Serveur non accessible (HTTP $http_code)"
fi