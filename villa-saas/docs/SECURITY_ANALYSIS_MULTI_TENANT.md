# Analyse de Sécurité et Multi-Tenancy - Villa SaaS

## Résumé Exécutif

Cette analyse examine l'implémentation de la sécurité et du multi-tenancy dans Villa SaaS. L'analyse révèle une architecture globalement solide avec quelques points d'amélioration identifiés.

### Points Forts ✅
- Architecture multi-tenant bien conçue avec isolation stricte des données
- Utilisation systématique du tenantId dans toutes les requêtes authentifiées
- Middleware d'authentification robuste qui injecte automatiquement le tenantId
- Index appropriés sur les colonnes tenantId pour la performance
- Gestion correcte des relations sans tenantId (PropertyImage) via isolation parentale

### Points d'Amélioration 🚨
- Absence de système de sauvegarde documenté
- Pas de politique de rétention des données explicite
- Manque d'audit logging systématique pour toutes les opérations sensibles
- Stockage des credentials d'intégration en JSON (même si marqué "chiffré")

## 1. Architecture Multi-Tenant

### 1.1 Modèles avec TenantId

Les modèles suivants incluent correctement un tenantId pour l'isolation :

```prisma
- Tenant (root)
- User
- Property
- Booking
- Period
- TouristTax
- EmailTemplate
- Integration
- AuditLog
- PromoCode
- Conversation
- AutoResponseTemplate
- AutoResponseRule
- BookingOption
- PaymentConfiguration
```

### 1.2 Modèles sans TenantId (Isolation par Relation)

Ces modèles n'ont pas de tenantId direct mais sont isolés via leurs relations parentes :

```prisma
- PropertyImage → via Property.tenantId
- BlockedPeriod → via Property.tenantId
- Review → via Property.tenantId et Booking.tenantId
- Payment → via Booking.tenantId
- Session/RefreshToken → via User.tenantId
```

**✅ Bonne pratique** : L'isolation par relation parente est correctement implémentée.

## 2. Implémentation de l'Isolation Tenant

### 2.1 Middleware d'Authentification

```typescript
// plugins/auth.ts
fastify.decorate('authenticate', async function (request, reply) {
  await request.jwtVerify();
  request.tenantId = request.user.tenantId; // ✅ Injection automatique
});
```

### 2.2 Utilisation dans les Routes

Exemple typique d'isolation correcte :

```typescript
// properties.routes.ts
const tenantId = getTenantId(request);
const properties = await fastify.prisma.property.findMany({
  where: createTenantFilter(tenantId), // ✅ Filtre tenant obligatoire
});
```

### 2.3 Cas Spécial : PropertyImage

Gestion correcte de l'isolation pour les modèles sans tenantId :

```typescript
// Vérifier d'abord que la propriété appartient au tenant
const property = await fastify.prisma.property.findFirst({
  where: { id: propertyId, tenantId },
});
if (!property) return reply.status(404).send({ error: 'Property not found' });

// Ensuite seulement, gérer les images
const images = await fastify.prisma.propertyImage.findMany({
  where: { propertyId }, // ✅ Pas besoin de tenantId, isolé via property
});
```

## 3. Index de Performance

### 3.1 Index Multi-Tenant

Les index suivants optimisent les requêtes multi-tenant :

```prisma
@@index([tenantId]) sur :
- User
- Property
- Period
- Booking
- TouristTax
- EmailTemplate
- Integration
- AuditLog
- PromoCode
- Conversation
- AutoResponseTemplate
- BookingOption
```

**✅ Bonne pratique** : Tous les modèles avec tenantId ont un index approprié.

### 3.2 Index Composites

Index composites pour les requêtes fréquentes :
- `@@unique([email, tenantId])` sur User
- `@@unique([tenantId, slug])` sur Property
- `@@unique([tenantId, type])` sur EmailTemplate

## 4. Gestion des Données Sensibles

### 4.1 Données PII Identifiées

```prisma
User:
- email ✅ (indexé)
- passwordHash ✅ (hashé)
- firstName, lastName
- phone

Booking:
- guestFirstName, guestLastName
- guestEmail ✅ (indexé)
- guestPhone
- guestAddress

Tenant:
- email ✅ (unique)
- phone
- siret, vatNumber (données entreprise)
```

### 4.2 Sécurité des Mots de Passe

```typescript
// Utilisation de bcryptjs pour le hashing
const passwordHash = await hashPassword(password);
```

**✅ Bonne pratique** : Utilisation de bcryptjs pour le hashing des mots de passe.

### 4.3 Credentials d'Intégration

```prisma
Integration:
  credentials Json // Marqué "Chiffré"
```

**🚨 Attention** : Les credentials sont stockés en JSON. Même si le commentaire indique "chiffré", il faut vérifier l'implémentation réelle du chiffrement.

## 5. Risques de Fuite de Données Identifiés

### 5.1 Routes Publiques

Les routes publiques utilisent des mécanismes différents :

```typescript
// public.routes.ts
// Recherche par domaine/subdomain pour identifier le tenant
const tenant = await fastify.prisma.tenant.findFirst({
  where: { publicSite: { domain, isActive: true } }
});
```

**✅ Sécurisé** : Les routes publiques identifient le tenant par domaine, pas d'accès direct aux données.

### 5.2 Absence de TenantId dans Certaines Requêtes

Cas légitimes identifiés :
- `BookingService.calculateBookingPrice()` : Récupère la propriété par ID mais vérifie le tenantId ensuite
- Routes d'authentification : Normal car création/connexion d'utilisateurs

### 5.3 Cascades de Suppression

Pas de `onDelete: Cascade` explicite dans le schéma, mais les relations sont bien définies.

**🚨 Recommandation** : Ajouter des cascades explicites pour éviter les données orphelines.

## 6. Audit et Logging

### 6.1 Modèle AuditLog

```prisma
model AuditLog {
  tenantId String
  userId String?
  action String
  entity String
  entityId String?
  details Json?
  ip String?
  userAgent String?
}
```

**🚨 Problème** : L'audit logging n'est pas systématiquement implémenté dans tous les modules.

Utilisation trouvée uniquement dans :
- `tenants.routes.ts`
- `payments.routes.ts`
- `auth.service.ts`

## 7. Sauvegardes et Récupération

### 7.1 État Actuel

**🚨 Critique** : Aucun système de sauvegarde documenté trouvé.

Le seul script DB trouvé est `update-db.sh` qui fait :
- `prisma generate`
- `prisma db push`

### 7.2 Recommandations

1. Implémenter une stratégie de sauvegarde automatisée
2. Documenter les procédures de récupération
3. Tester régulièrement les restaurations
4. Mettre en place une réplication de base de données

## 8. Recommandations d'Amélioration

### 8.1 Priorité Haute 🔴

1. **Implémenter les Sauvegardes**
   ```bash
   # Créer scripts/backup-db.sh
   pg_dump avec rotation des sauvegardes
   Sauvegardes S3 chiffrées
   ```

2. **Audit Logging Systématique**
   ```typescript
   // Créer un décorateur @Audit
   @Audit('property.update')
   async updateProperty() { ... }
   ```

3. **Chiffrement des Credentials**
   ```typescript
   // Utiliser crypto pour chiffrer les credentials avant stockage
   const encrypted = encrypt(credentials, process.env.ENCRYPTION_KEY);
   ```

### 8.2 Priorité Moyenne 🟡

1. **Politique de Rétention**
   ```typescript
   // Créer un job de nettoyage
   // Supprimer les logs > 90 jours
   // Anonymiser les données des bookings > 2 ans
   ```

2. **Monitoring des Accès Cross-Tenant**
   ```typescript
   // Alertes si requête accède à des données d'un autre tenant
   if (result.tenantId !== request.tenantId) {
     logger.alert('Cross-tenant access attempt');
   }
   ```

3. **Tests de Sécurité Automatisés**
   ```typescript
   // Tests qui vérifient l'isolation tenant
   test('should not access other tenant data', async () => {
     // Créer 2 tenants et vérifier l'isolation
   });
   ```

### 8.3 Priorité Basse 🟢

1. **Documentation de Sécurité**
   - Guide de sécurité pour les développeurs
   - Checklist de revue de code
   - Procédures en cas d'incident

2. **Rotation des Tokens**
   - Implémenter la rotation automatique des refresh tokens
   - Expiration plus courte des access tokens

## 9. Conformité RGPD

### 9.1 Points Positifs

- Modèle de données permet l'export des données utilisateur
- Possibilité de supprimer un tenant et toutes ses données
- Emails et données personnelles correctement identifiés

### 9.2 À Implémenter

1. **Droit à l'Oubli**
   ```typescript
   // Endpoint pour anonymiser/supprimer les données personnelles
   POST /api/users/:id/forget
   ```

2. **Export des Données**
   ```typescript
   // Endpoint pour exporter toutes les données d'un utilisateur
   GET /api/users/:id/export
   ```

3. **Consentement**
   - Ajouter un champ `consents` dans User
   - Logger les consentements dans AuditLog

## 10. Conclusion

L'implémentation multi-tenant de Villa SaaS est **globalement solide et sécurisée**. Les principes de base sont bien respectés :
- ✅ Isolation systématique par tenantId
- ✅ Authentification robuste
- ✅ Index appropriés pour la performance
- ✅ Gestion correcte des relations

Les points d'amélioration principaux concernent :
- 🚨 L'absence de sauvegardes documentées
- 🚨 Le manque d'audit logging systématique
- 🚨 L'absence de politique de rétention des données

Avec les améliorations recommandées, le système atteindra un excellent niveau de sécurité et de conformité pour une application SaaS multi-tenant.