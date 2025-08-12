#!/bin/bash

echo "🔧 Test du webhook Stripe avec un paiement réel"
echo "=============================================="
echo ""
echo "Ce script teste le webhook après avoir configuré le bon secret."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📝 Instructions:${NC}"
echo "1. Assurez-vous d'avoir mis à jour STRIPE_WEBHOOK_SECRET sur Railway"
echo "2. Attendez que Railway ait redéployé (environ 1-2 minutes)"
echo "3. Faites une nouvelle réservation sur le site"
echo ""

echo -e "${GREEN}✅ Vérifications à faire:${NC}"
echo "- Dans Stripe Dashboard → Webhooks → Votre webhook → Webhook attempts"
echo "  Vous devriez voir une tentative avec status 200 (succès)"
echo ""
echo "- Dans Railway logs:"
echo "  railway logs | grep 'Confirmation email sent'"
echo ""
echo "- Dans votre boîte email:"
echo "  Un email de confirmation devrait arriver"
echo ""

echo -e "${YELLOW}🔍 Pour voir les logs en temps réel:${NC}"
echo "railway logs --tail"
echo ""

echo -e "${GREEN}✅ Si le webhook fonctionne, vous verrez:${NC}"
echo "- 'Payment confirmed for booking' dans les logs"
echo "- 'Confirmation email sent' dans les logs"
echo "- L'email de confirmation dans votre boîte de réception"