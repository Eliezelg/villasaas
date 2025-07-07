# Villa SaaS - Tâches Restantes

## 📅 Résumé
Ce document liste toutes les tâches TODO restantes trouvées dans le code, organisées par priorité.

## ✅ Tâches Complétées
1. ✅ Charger les métadonnées du tenant depuis l'API (layout.tsx)
2. ✅ Implémenter notification d'échec de paiement et annulation réservation
3. ✅ Envoyer email de confirmation après confirmation réservation avec code d'accès

## 🔴 Priorité HAUTE (5 tâches)

### 1. Créer template et implémenter sendBookingNotificationToOwner
**Fichier**: `/apps/backend/src/services/email.service.ts` (ligne 267)
- Créer template d'email pour notifier le propriétaire d'une nouvelle réservation
- Inclure les détails de la réservation et du client
- Support multilingue (FR/EN)

### 2. Créer template et implémenter sendCheckInReminder
**Fichier**: `/apps/backend/src/services/email.service.ts` (ligne 272)
- Template de rappel envoyé 24-48h avant l'arrivée
- Rappeler l'heure d'arrivée et les informations de base
- Préparer le client à recevoir les instructions détaillées

### 3. Créer template et implémenter sendCheckInInstructions
**Fichier**: `/apps/backend/src/services/email.service.ts` (ligne 277)
- Instructions détaillées pour l'arrivée (adresse, codes d'accès, etc.)
- Informations pratiques (WiFi, équipements, contacts urgence)
- Support multilingue avec formatage clair

### 4. Créer template et implémenter sendReviewRequest
**Fichier**: `/apps/backend/src/services/email.service.ts` (ligne 282)
- Email envoyé après le départ pour demander un avis
- Lien direct vers la page d'avis
- Ton amical et personnalisé

### 5. Implémenter gestion des remboursements lors de l'annulation
**Fichier**: `/apps/backend/src/modules/bookings/booking.routes.ts` (ligne 544)
- Intégrer avec Stripe pour effectuer les remboursements
- Calculer le montant selon la politique d'annulation
- Envoyer email de confirmation du remboursement

## 🟡 Priorité MOYENNE (3 tâches)

### 1. Implémenter notification administrateur pour litiges Stripe
**Fichier**: `/apps/backend/src/modules/payments/payments.routes.ts` (ligne 402)
- Envoyer email à l'admin quand un litige est créé
- Inclure les détails du litige et de la réservation
- Permettre un suivi rapide

### 2. Implémenter copie des images S3 pour duplication propriétés
**Fichier**: `/apps/backend/src/services/s3.service.ts` (ligne 147)
- Copier les images d'une propriété vers une nouvelle
- Conserver l'ordre et les métadonnées
- Gérer les erreurs de copie

### 3. Calculer le taux d'occupation réel dans les statistiques
**Fichier**: `/apps/backend/src/modules/bookings/booking.routes.ts` (ligne 628)
- Calculer occupation = jours réservés / jours disponibles
- Exclure les périodes bloquées du calcul
- Retourner pourcentage précis

## 🟢 Priorité BASSE (2 tâches)

### 1. Récupérer le vrai tenantId dans les logs d'email
**Fichier**: `/apps/backend/src/services/email.service.ts` (ligne 128)
- Remplacer 'system' par le vrai tenantId dans les logs
- Permettre un meilleur tracking par tenant
- Améliorer les rapports d'utilisation

### 2. Intégrer OpenAI pour les embeddings de recherche
**Fichier**: `/apps/backend/src/services/property-ai.service.ts` (ligne 131)
- Remplacer le mock par l'API OpenAI text-embedding-3-small
- Générer des embeddings pour la recherche sémantique
- Optimiser les performances de recherche

## 📊 Statistiques
- **Total**: 10 tâches restantes
- **Haute priorité**: 5 (50%)
- **Moyenne priorité**: 3 (30%)
- **Basse priorité**: 2 (20%)

## 🛠️ Recommandations

1. **Templates d'emails** (4 tâches): Créer tous les templates en une fois pour assurer la cohérence visuelle et du code

2. **Intégrations Stripe** (2 tâches): Grouper les tâches de remboursement et notification de litige

3. **Optimisations** (3 tâches): Les tâches de priorité moyenne/basse peuvent être reportées à une phase ultérieure

4. **Tests**: Chaque fonctionnalité implémentée devrait avoir des tests unitaires et d'intégration

## 📝 Notes
- Les numéros de ligne peuvent changer avec les modifications du code
- Certaines tâches peuvent nécessiter des modifications de la base de données
- Les templates d'emails devraient suivre le pattern établi avec BaseEmail et i18n