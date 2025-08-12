# Villa SaaS Backend API

## Description

Backend API pour plateforme Villa SaaS - Solution de gestion multi-tenant pour locations de vacances.

## Technologies

- **Framework**: Fastify 4.x
- **Language**: TypeScript
- **Base de données**: PostgreSQL avec Prisma ORM
- **Cache**: Redis
- **Authentification**: JWT
- **Documentation**: Swagger/OpenAPI
- **Validation**: Zod

## Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Démarrer PostgreSQL et Redis
docker-compose up -d

# Appliquer les migrations
npm run db:push

# Seed de la base de données (optionnel)
npm run db:seed
```

## Scripts disponibles

```bash
# Développement avec hot-reload
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start

# Tests
npm test
npm run test:watch

# Linting et type checking
npm run lint
npm run typecheck
```

## Documentation API

### 📚 Documentation interactive Swagger

Une fois le serveur démarré, accédez à la documentation interactive :

**URL**: http://api.webpro200.com/documentation

### 📄 Documentation complète

Consultez le fichier [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) pour une documentation détaillée de tous les endpoints.

### 🔐 Authentification

L'API utilise JWT pour l'authentification. Incluez le token dans l'en-tête :

```
Authorization: Bearer <your-token>
```

### 🏢 Multi-tenancy

Toutes les données sont isolées par tenant (organisation). Le tenant est automatiquement déterminé à partir du token JWT.

## Structure du projet

```
src/
├── app.ts              # Configuration Fastify
├── server.ts           # Point d'entrée
├── config/             # Configuration
├── modules/            # Modules métier
│   ├── auth/          # Authentification
│   ├── properties/    # Propriétés
│   ├── periods/       # Périodes tarifaires
│   ├── pricing/       # Calcul des prix
│   ├── tenants/       # Organisations
│   └── users/         # Utilisateurs
├── plugins/           # Plugins Fastify
├── services/          # Services métier
├── utils/             # Utilitaires
└── types/             # Types TypeScript
```

## Endpoints principaux

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/properties` - Liste des propriétés
- `POST /api/properties` - Créer une propriété
- `GET /api/periods` - Périodes tarifaires
- `POST /api/pricing/calculate` - Calculer un prix

## Variables d'environnement

```env
# Server
NODE_ENV=development
PORT=3001
API_URL=http://api.webpro200.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/villa_saas

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

## Sécurité

- ✅ Authentification JWT avec refresh tokens
- ✅ Rate limiting (100 req/min par IP)
- ✅ Validation des entrées avec Zod
- ✅ Helmet pour les headers de sécurité
- ✅ CORS configuré
- ✅ Isolation multi-tenant
- ✅ Hashage des mots de passe avec bcrypt

## Tests

```bash
# Tous les tests
npm test

# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Coverage
npm run test:coverage
```

## Déploiement

1. Build l'application : `npm run build`
2. Configurer les variables d'environnement de production
3. Démarrer avec PM2 ou autre gestionnaire de processus
4. Configurer un reverse proxy (Nginx/Caddy)
5. Activer HTTPS

## Contribution

1. Créer une branche feature : `git checkout -b feature/ma-feature`
2. Commiter les changements : `git commit -m 'feat: add new feature'`
3. Pusher la branche : `git push origin feature/ma-feature`
4. Créer une Pull Request

## Support

Pour toute question ou problème, ouvrir une issue sur GitHub.