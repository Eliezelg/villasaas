# Notes Importantes - Villa SaaS

## 🚨 Points Critiques à Retenir

### 1. Authentification Fastify
```typescript
// ❌ INCORRECT - authenticateUser n'existe pas
preHandler: [authenticateUser]

// ✅ CORRECT - Utiliser fastify.authenticate
preHandler: [fastify.authenticate]
```

### 2. Validation avec Zod dans Fastify
```typescript
// ❌ INCORRECT - Ne pas passer Zod directement aux schémas Fastify
fastify.post('/route', {
  schema: {
    body: zodSchema
  }
})

// ✅ CORRECT - Valider manuellement dans le handler
fastify.post('/route', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const validation = zodSchema.safeParse(request.body);
  if (!validation.success) {
    return reply.code(400).send({ error: validation.error });
  }
  const data = validation.data;
  // ...
})
```

### 3. Multi-tenancy Obligatoire
```typescript
// ❌ JAMAIS sans tenantId
const property = await prisma.property.findFirst({
  where: { id: propertyId }
});

// ✅ TOUJOURS avec tenantId
const property = await prisma.property.findFirst({
  where: { 
    id: propertyId,
    tenantId: req.tenantId // Récupéré via getTenantId(request)
  }
});
```

### 4. PropertyImage sans tenantId
```typescript
// PropertyImage n'a PAS de tenantId direct
// L'isolation se fait via la relation avec Property

// 1. Vérifier d'abord la propriété
const property = await prisma.property.findFirst({
  where: { id: propertyId, tenantId }
});
if (!property) throw new Error('Not found');

// 2. Ensuite gérer les images
const image = await prisma.propertyImage.create({
  data: { 
    propertyId,  // Suffit pour l'isolation
    url: '...',
    // PAS de tenantId ici
  }
});
```

### 5. Routes API Frontend
```typescript
// Toutes les routes API doivent commencer par /api/
apiClient.get('/api/properties')     // ✅
apiClient.get('/properties')         // ❌
```

### 6. Gestion des erreurs TypeScript
```typescript
// Toujours vérifier les données undefined
const { data } = await service.getData();
if (data) {  // ✅ Vérification nécessaire
  // Utiliser data
}

// Pour les arrays
const items = data?.items || [];  // ✅ Fallback sûr
```

### 7. Périodes tarifaires chevauchantes
- Les périodes peuvent se chevaucher
- La priorité la plus élevée est appliquée
- Pas de validation de chevauchement lors de la création
- Permet les promotions et tarifs spéciaux

### 8. Dépendances Monorepo
```json
// ❌ workspace:* non supporté par npm
"@villa-saas/database": "workspace:*"

// ✅ Utiliser file:
"@villa-saas/database": "file:../../packages/database"
```

### 9. Images optimisées
- 4 tailles générées : small (400px), medium (800px), large (1200px), original
- Format WebP pour la compression
- URLs stockées dans un champ JSON `urls`
- Upload dans `apps/backend/uploads/properties/`

### 10. Commandes essentielles
```bash
# Mise à jour DB (après changement schema.prisma)
./update-db.sh

# Développement
npm run dev          # Dans chaque app

# Tests
npm test            # Tous les tests

# Build
npm run build       # Vérifier les erreurs TS
```

## 🐛 Problèmes Résolus

1. **argon2 → bcryptjs** : Compatibilité système
2. **CORS images** : Headers ajoutés dans le plugin static
3. **Géocodage** : Pas de User-Agent depuis le navigateur
4. **Dates invalides** : Validation des query params obligatoire
5. **Build TypeScript** : Array.from() au lieu de spread sur Set

## 📝 Patterns à Suivre

### Services Frontend
```typescript
class ServiceName {
  async getAll() {
    return apiClient.get<Type[]>('/api/endpoint');
  }
  
  async create(data: CreateType) {
    return apiClient.post<Type>('/api/endpoint', data);
  }
}

export const serviceName = new ServiceName();
```

### Optimistic UI
```typescript
const [localState, setLocalState] = useState(serverState);

// Mise à jour optimiste
setLocalState(newState);

// Sync serveur
const { error } = await apiCall();
if (error) {
  setLocalState(serverState); // Rollback
}
```

### Structure Module Backend
```
modules/[feature]/
├── [feature].routes.ts     # Routes Fastify
├── [feature].service.ts    # Logique métier
├── [feature].repository.ts # Requêtes DB
├── [feature].dto.ts        # Types/validation
└── [feature].test.ts       # Tests
```

## 🎯 Checklist Nouveau Module

1. **Backend**
   - [ ] Routes avec `fastify.authenticate`
   - [ ] Validation Zod dans les handlers
   - [ ] Multi-tenancy (tenantId)
   - [ ] Documentation Swagger
   - [ ] Tests unitaires

2. **Frontend**
   - [ ] Service avec routes `/api/`
   - [ ] Types TypeScript
   - [ ] Gestion erreurs undefined
   - [ ] Toasts feedback
   - [ ] Composants réutilisables

3. **Database**
   - [ ] Schema Prisma
   - [ ] Index sur les clés étrangères
   - [ ] `./update-db.sh`
   - [ ] Test avec Prisma Studio