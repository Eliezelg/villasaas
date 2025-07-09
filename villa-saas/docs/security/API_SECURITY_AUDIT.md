# Audit de Sécurité des API Villa SaaS

Date : 09 Juillet 2025  
Version : 1.0

## Résumé Exécutif

Cette analyse de sécurité a examiné l'architecture des API Villa SaaS, la validation des données, et les mécanismes de protection. Bien que l'application implémente plusieurs bonnes pratiques de sécurité, des vulnérabilités critiques ont été identifiées, notamment dans le système de contrôle d'accès.

### Niveau de Risque Global : **MOYEN-ÉLEVÉ** ⚠️

## 1. Architecture de Sécurité

### 1.1 Points Forts ✅

#### Authentication JWT
- Implémentation solide avec `@fastify/jwt`
- Tokens à durée de vie courte (15 minutes)
- Système de refresh tokens
- Middleware d'authentification bien intégré

#### Protection des Headers
- Utilisation de Helmet pour les headers de sécurité
- Configuration CORS appropriée avec validation d'origine
- Headers de sécurité standards activés

#### Validation des Données
- Utilisation systématique de Zod pour la validation
- Schémas stricts avec contraintes appropriées
- Types bien définis et validation côté serveur

### 1.2 Vulnérabilités Identifiées 🚨

## 2. Analyse Détaillée des Vulnérabilités

### 2.1 Contrôle d'Accès Insuffisant (CRITIQUE) 🔴

**Problème** : Le système RBAC est défini mais très peu implémenté.

**Impact** : Un utilisateur USER peut accéder à des fonctionnalités d'administration.

**Exemples problématiques** :
```typescript
// ❌ La plupart des routes ne vérifient PAS les permissions
fastify.patch('/:id', {
  preHandler: [fastify.authenticate], // Authentification seulement
}, async (request, reply) => {
  // Aucune vérification de rôle/permission
  const property = await fastify.prisma.property.update({...});
});

// ✅ Rare exemple de bonne pratique (users.routes.ts)
if (!['OWNER', 'ADMIN'].includes(request.user!.role)) {
  reply.status(403).send({ error: 'Forbidden' });
}
```

**Recommandations** :
1. Créer un middleware de permissions réutilisable
2. Implémenter des décorateurs pour les rôles requis
3. Ajouter des vérifications systématiques sur toutes les routes sensibles

### 2.2 Rate Limiting Générique (ÉLEVÉ) 🟠

**Problème** : Un seul rate limit global pour toutes les routes.

**Impact** : 
- Pas de protection spécifique contre le brute force sur `/auth/login`
- Les endpoints critiques (paiements) ont la même limite que les routes de lecture

**Configuration actuelle** :
```typescript
await app.register(rateLimit, {
  max: 100,          // Même limite pour tout
  timeWindow: 60000, // 1 minute
});
```

**Recommandations** :
1. Implémenter des rate limits différenciés par route
2. Limites plus strictes sur : login (5/min), register (3/min), payments (10/min)
3. Ajouter un système de blocage progressif pour les tentatives répétées

### 2.3 Exposition d'Informations Sensibles (MOYEN) 🟡

**Problème** : Les messages d'erreur peuvent révéler des détails techniques.

**Exemples** :
```typescript
// error-handler.ts
case 'P2002':
  reply.status(409).send({
    error: 'Conflict',
    message: 'A record with this value already exists',
    field: error.meta?.target, // ❌ Expose le nom du champ DB
  });
```

**Recommandations** :
1. Masquer les détails techniques en production
2. Logger les erreurs complètes côté serveur uniquement
3. Retourner des messages génériques aux clients

### 2.4 Absence de Protection CSRF (MOYEN) 🟡

**Problème** : Aucune protection CSRF implémentée.

**Impact** : Vulnérabilité aux attaques CSRF sur les mutations d'état.

**Recommandations** :
1. Implémenter des tokens CSRF pour les mutations
2. Valider l'origine des requêtes pour les opérations sensibles
3. Utiliser SameSite cookies

### 2.5 Validation Incohérente (BAS) 🟢

**Problème** : Double validation (Fastify schema + Zod) dans certaines routes.

**Exemple** :
```typescript
// properties.routes.ts
fastify.post('/', {
  schema: { body: {...} }, // Validation Fastify
}, async (request, reply) => {
  const data = createPropertySchema.parse(request.body); // Validation Zod
});
```

**Recommandations** :
1. Utiliser uniquement Zod avec `safeParse()`
2. Supprimer les schémas Fastify pour éviter les incohérences

## 3. Bonnes Pratiques Observées ✅

### 3.1 Protection contre les Injections SQL
- Utilisation exclusive de Prisma ORM
- Pas de requêtes SQL brutes
- Paramètres toujours échappés automatiquement

### 3.2 Multi-Tenancy
- Isolation systématique par `tenantId`
- Utilisation cohérente de `getTenantId()` helper
- Filtrage obligatoire dans toutes les requêtes

### 3.3 Sécurité des Mots de Passe
- Hachage avec bcrypt
- Validation de complexité (8 caractères minimum)
- Pas de stockage en clair

## 4. Recommandations Prioritaires

### 4.1 Actions Immédiates (< 1 semaine)

1. **Implémenter un middleware de permissions**
```typescript
export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(request.user?.role)) {
      reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
}
```

2. **Ajouter des rate limits spécifiques**
```typescript
// auth.routes.ts
fastify.post('/login', {
  config: {
    rateLimit: { max: 5, timeWindow: '5 minutes' }
  }
}, loginHandler);
```

3. **Masquer les erreurs techniques en production**

### 4.2 Actions Court Terme (< 1 mois)

1. **Implémenter la protection CSRF**
2. **Ajouter la validation du Content-Type**
3. **Implémenter un système d'audit logging complet**
4. **Ajouter la détection d'anomalies (tentatives de brute force)**

### 4.3 Actions Long Terme (< 3 mois)

1. **Implémenter un WAF (Web Application Firewall)**
2. **Ajouter la surveillance de sécurité en temps réel**
3. **Effectuer des tests de pénétration**
4. **Implémenter la rotation automatique des secrets**

## 5. Matrice de Risques

| Vulnérabilité | Probabilité | Impact | Risque | Priorité |
|--------------|-------------|---------|---------|----------|
| Contrôle d'accès insuffisant | Élevée | Critique | 🔴 Critique | P0 |
| Rate limiting générique | Élevée | Élevé | 🟠 Élevé | P1 |
| Exposition d'informations | Moyenne | Moyen | 🟡 Moyen | P2 |
| Absence CSRF | Moyenne | Moyen | 🟡 Moyen | P2 |
| Validation incohérente | Faible | Faible | 🟢 Faible | P3 |

## 6. Checklist de Sécurité

### Authentification & Autorisation
- [x] JWT implementation
- [x] Refresh tokens
- [ ] ⚠️ Role-based access control
- [ ] ⚠️ Permission checks on all routes
- [ ] Two-factor authentication

### Protection des API
- [x] Rate limiting (basique)
- [ ] ⚠️ Rate limiting par endpoint
- [ ] ⚠️ CSRF protection
- [x] CORS configuration
- [x] Helmet headers

### Validation & Sanitization
- [x] Input validation (Zod)
- [x] SQL injection protection (Prisma)
- [ ] ⚠️ XSS protection for user content
- [ ] File upload validation

### Monitoring & Logging
- [x] Basic error logging
- [ ] ⚠️ Security audit logging
- [ ] Anomaly detection
- [ ] Real-time alerts

## 7. Conclusion

Villa SaaS possède une base solide de sécurité avec JWT, Prisma, et Zod. Cependant, l'absence de contrôles d'accès appropriés représente un risque critique qui doit être adressé immédiatement. L'implémentation des recommandations prioritaires permettra de réduire significativement la surface d'attaque.

### Prochaines Étapes
1. Implémenter le middleware de permissions (URGENT)
2. Configurer des rate limits spécifiques
3. Réviser la gestion des erreurs en production
4. Planifier un audit de sécurité externe

---

*Cet audit doit être revu régulièrement et mis à jour après chaque changement majeur de l'architecture.*