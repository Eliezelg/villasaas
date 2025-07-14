#!/bin/bash

# Test User Management System
# This script tests the complete user management functionality

API_URL="${API_URL:-http://localhost:3001/api}"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing User Management System...${NC}"

# 1. Login as owner
echo -e "\n${BLUE}1. Logging in as owner...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to login${NC}"
  exit 1
fi

echo -e "${GREEN}Login successful${NC}"

# 2. Get all users
echo -e "\n${BLUE}2. Getting all users...${NC}"
USERS_RESPONSE=$(curl -s -X GET "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $USERS_RESPONSE"

# 3. Invite a new user
echo -e "\n${BLUE}3. Inviting a new user...${NC}"
INVITE_RESPONSE=$(curl -s -X POST "$API_URL/users/invite" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "USER"
  }')

echo "Response: $INVITE_RESPONSE"

# Check if invitation was successful
if echo "$INVITE_RESPONSE" | grep -q "User invited successfully"; then
  echo -e "${GREEN}User invitation successful${NC}"
  
  # Extract user ID from response
  USER_ID=$(echo $INVITE_RESPONSE | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | tail -1)
  
  if [ ! -z "$USER_ID" ]; then
    # 4. Resend invitation
    echo -e "\n${BLUE}4. Resending invitation...${NC}"
    RESEND_RESPONSE=$(curl -s -X POST "$API_URL/users/$USER_ID/resend-invite" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Response: $RESEND_RESPONSE"
    
    if echo "$RESEND_RESPONSE" | grep -q "Invitation resent successfully"; then
      echo -e "${GREEN}Invitation resent successfully${NC}"
    else
      echo -e "${RED}Failed to resend invitation${NC}"
    fi
  fi
else
  echo -e "${RED}Failed to invite user${NC}"
fi

# 5. Get current user
echo -e "\n${BLUE}5. Getting current user info...${NC}"
ME_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ME_RESPONSE"

echo -e "\n${GREEN}User management system test completed!${NC}"