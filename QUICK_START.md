# Guide de Démarrage Rapide - Villa SaaS

## 1. Démarrer Docker
```bash
docker-compose up -d
```

## 2. Backend - Terminal 1
```bash
cd backend

# Si première fois, installer Prisma
npm install --save-dev prisma@5.8.1
npm install @prisma/client@5.8.1

# Générer le client Prisma
./node_modules/.bin/prisma generate

# Appliquer le schéma à la base de données
./node_modules/.bin/prisma db push

# Seed la base de données
npm run db:seed

# Démarrer le serveur
npm run dev
```

## 3. Frontend - Terminal 2
```bash
cd frontend

# Démarrer le serveur
npm run dev
```

## 4. Accès
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## 5. Connexion
- Email: owner@demo.villa-saas.com
- Mot de passe: Demo1234!

## Problèmes courants

### Erreur Prisma version
Si vous avez une erreur de version Prisma, exécutez :
```bash
cd backend
rm -rf node_modules/@prisma node_modules/prisma
npm install --save-dev prisma@5.8.1
npm install @prisma/client@5.8.1
```

### Port PostgreSQL
Le projet utilise le port 5433 (pas 5432). Vérifiez que Docker Compose est bien démarré.

### tsx not found
Le script de seed utilise maintenant Node.js directement (seed.js) au lieu de TypeScript.