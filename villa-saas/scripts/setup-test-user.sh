#!/bin/bash

# Script pour créer un utilisateur de test

API_URL="http://127.0.0.1:3001"

echo "Creating test user..."

# Créer un nouvel utilisateur de test
TIMESTAMP=$(date +%s)
REGISTER_DATA='{
  "email": "test-'$TIMESTAMP'@example.com",
  "password": "test123456",
  "firstName": "API",
  "lastName": "Test",
  "companyName": "Test Company '$TIMESTAMP'"
}'

response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA" \
  "$API_URL/api/auth/register")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ]; then
  echo "User created successfully!"
  echo "$body" | jq .
else
  echo "Failed to create user. Status: $http_code"
  echo "$body" | jq . 2>/dev/null || echo "$body"
fi