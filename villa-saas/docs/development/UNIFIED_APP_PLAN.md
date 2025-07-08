# Plan d'Unification des Applications Villa SaaS

## Vue d'ensemble

Ce document décrit le plan pour unifier les 3 applications Next.js (web, booking, hub) en une seule application avec la structure suivante :
- `location.com` → Hub (page d'accueil)
- `location.com/admin` → Dashboard admin
- `demo.location.com` → Site booking du tenant "demo"

## Architecture cible

```
apps/unified/
├── src/
│   ├── app/
│   │   ├── (hub)/              # Routes publiques du hub
│   │   │   ├── layout.tsx      # Layout public
│   │   │   ├── page.tsx        # Page d'accueil
│   │   │   └── search/         # Recherche AI
│   │   ├── admin/              # Routes admin (protégées)
│   │   │   ├── layout.tsx      # Layout dashboard
│   │   │   ├── (auth)/         # Pages auth
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── dashboard/      # Routes dashboard
│   │   │       ├── page.tsx
│   │   │       ├── properties/
│   │   │       ├── bookings/
│   │   │       └── analytics/
│   │   ├── [locale]/           # Routes booking multi-tenant
│   │   │   ├── layout.tsx      # Layout booking avec i18n
│   │   │   ├── page.tsx        # Liste propriétés
│   │   │   ├── properties/
│   │   │   └── booking/
│   │   ├── api/                # Routes API
│   │   ├── layout.tsx          # Root layout
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── admin/              # Composants admin (depuis apps/web)
│   │   ├── booking/            # Composants booking (depuis apps/booking)
│   │   ├── hub/                # Composants hub (depuis apps/hub)
│   │   └── shared/             # Composants partagés
│   ├── services/               # Services unifiés
│   ├── stores/                 # Stores Zustand unifiés
│   ├── hooks/                  # Hooks réutilisables
│   ├── lib/                    # Utilitaires
│   └── middleware.ts           # Middleware unifié
```

## Plan d'implémentation

### Phase 1 : Préparation de la structure

1. **Créer apps/unified avec Next.js 14**
   - Copier la configuration de base depuis apps/booking (la plus complète)
   - Inclure support i18n, PWA, SEO
   - Configurer Tailwind avec les tokens existants

2. **Installer les dépendances communes**
   - Merger les dependencies des 3 package.json
   - Résoudre les conflits de versions
   - Ajouter les packages workspace

### Phase 2 : Migration du middleware

1. **Créer middleware.ts unifié**
   ```typescript
   // Logique de détection :
   // 1. Si pathname.startsWith('/admin') → Vérifier auth
   // 2. Si subdomain existe → Mode booking tenant
   // 3. Sinon → Mode hub public
   ```

2. **Intégrer les 3 logiques**
   - Tenant detection (depuis apps/booking)
   - Auth check pour /admin (nouveau)
   - i18n pour les routes booking

### Phase 3 : Migration des composants

1. **Copier les composants par domaine**
   - `components/admin/` ← apps/web/src/components/
   - `components/booking/` ← apps/booking/src/components/
   - `components/hub/` ← apps/hub/src/components/

2. **Unifier les composants partagés**
   - UI components (Button, Card, etc.)
   - Layouts réutilisables
   - Providers communs

### Phase 4 : Migration des routes

1. **Routes Hub (racine)**
   - Copier apps/hub/src/app/* vers app/(hub)/
   - Adapter le layout pour le nouveau contexte

2. **Routes Admin**
   - Copier apps/web/src/app/dashboard/* vers app/admin/dashboard/
   - Copier les pages auth vers app/admin/(auth)/
   - Ajouter protection middleware

3. **Routes Booking**
   - Copier apps/booking/src/app/[locale]/* vers app/[locale]/
   - Conserver la structure i18n
   - Adapter pour la détection de tenant

### Phase 5 : Services et API

1. **Unifier les API clients**
   - Créer un ApiClient unique avec contextes
   - Gérer les headers tenant/auth selon le contexte
   - Consolider les endpoints

2. **Adapter les services**
   - Merger les services similaires
   - Créer des namespaces par domaine

### Phase 6 : Configuration et tests

1. **Variables d'environnement**
   - Fusionner les .env.example
   - Documenter les nouvelles variables

2. **Scripts package.json**
   - dev, build, start
   - Scripts de test par domaine

## Fichiers à copier directement

### Depuis apps/web :
- `src/components/` → `components/admin/`
- `src/app/dashboard/` → `app/admin/dashboard/`
- `src/services/` → `services/admin/`
- `src/stores/` → `stores/`
- `src/lib/api-client.ts` → À fusionner

### Depuis apps/booking :
- `src/components/` → `components/booking/`
- `src/app/[locale]/` → `app/[locale]/`
- `src/hooks/` → `hooks/`
- `src/i18n.ts` → Racine
- `src/middleware.ts` → À adapter
- Configuration PWA et manifests

### Depuis apps/hub :
- `src/components/` → `components/hub/`
- `src/app/` → `app/(hub)/`
- `src/services/ai.service.ts` → `services/`

## Avantages de l'unification

1. **Simplicité** : Un seul déploiement, une seule app
2. **Partage de code** : Composants et services réutilisés
3. **SSO possible** : Auth partagée entre hub et admin
4. **SEO amélioré** : Hub sur le domaine principal
5. **Coûts réduits** : Moins d'infrastructure

## Points d'attention

1. **Bundle size** : Utiliser le code splitting agressif
2. **Isolation** : Bien séparer les contextes admin/booking/hub
3. **Performance** : Lazy loading des sections non utilisées
4. **Sécurité** : Validation stricte des routes admin
5. **Multi-tenancy** : Tester tous les cas d'usage

## Commandes de migration

```bash
# 1. Créer la nouvelle app
cd apps/
npx create-next-app@14 unified --typescript --tailwind --app --no-src-dir

# 2. Copier les fichiers (depuis la racine du projet)
# Hub
cp -r apps/hub/src/components apps/unified/src/components/hub
cp -r apps/hub/src/app/* apps/unified/src/app/\(hub\)/

# Admin
cp -r apps/web/src/components apps/unified/src/components/admin
cp -r apps/web/src/app/dashboard apps/unified/src/app/admin/

# Booking
cp -r apps/booking/src/components apps/unified/src/components/booking
cp -r apps/booking/src/app/\[locale\] apps/unified/src/app/

# Services et utils
cp -r apps/web/src/services apps/unified/src/services/admin
cp -r apps/booking/src/services apps/unified/src/services/booking
cp -r apps/hub/src/services apps/unified/src/services/hub
```

## Prochaines étapes

1. Valider ce plan avec l'équipe
2. Créer une branche `feature/unified-app`
3. Suivre le plan phase par phase
4. Tester chaque mode (hub, admin, booking) à chaque étape
5. Migration progressive avec feature flags si nécessaire