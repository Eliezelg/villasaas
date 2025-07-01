# Plan de Migration vers Monorepo

## Structure cible

```
villa-saas/
├── apps/
│   ├── backend/      # API Fastify (depuis ./backend)
│   └── web/          # Frontend Next.js (depuis ./frontend)
├── packages/
│   ├── database/     # Prisma schema + client
│   ├── types/        # Types TypeScript partagés
│   ├── utils/        # Fonctions utilitaires
│   └── ui/           # Composants UI partagés
├── docker-compose.yml
├── package.json      # Root workspace
├── pnpm-workspace.yaml
└── turbo.json        # Configuration Turborepo
```

## Étapes de migration

1. **Créer la nouvelle structure**
2. **Configurer pnpm workspaces**
3. **Déplacer le backend vers apps/backend**
4. **Déplacer le frontend vers apps/web**
5. **Extraire le package database**
6. **Créer le package types**
7. **Créer le package utils**
8. **Créer le package ui**
9. **Configurer Turborepo**
10. **Mettre à jour les imports**

## Avantages
- Partage de code facilité
- Build et tests optimisés avec Turborepo
- Types partagés entre frontend et backend
- Composants UI réutilisables
- Gestion centralisée des dépendances