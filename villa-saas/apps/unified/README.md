# Villa SaaS - Application Unifiée

Cette application unifie les 3 applications précédentes (hub, admin, booking) en une seule application Next.js.

## Architecture

- **Hub** (`location.com`) : Page d'accueil avec recherche AI
- **Admin** (`location.com/admin`) : Dashboard pour les propriétaires
- **Booking** (`tenant.location.com`) : Sites de réservation multi-tenant

## Installation

```bash
# Depuis la racine du projet
npm install

# Copier le fichier d'environnement
cd apps/unified
cp .env.local.example .env.local
```

## Démarrage

```bash
# Depuis la racine
npm run dev:unified

# Ou directement dans le dossier
cd apps/unified
npm run dev
```

## Accès aux différents modes

### Mode Hub (défaut)
- URL: http://localhost:3000
- Page d'accueil avec recherche AI

### Mode Admin
- URL: http://localhost:3000/admin
- Nécessite une authentification
- Dashboard de gestion des propriétés

### Mode Booking (multi-tenant)
- URL: http://demo.localhost:3000 (tenant "demo")
- URL: http://villa1.localhost:3000 (tenant "villa1")
- Sites publics de réservation

## Configuration des domaines

### Développement local
Pour tester les sous-domaines en local, ajoutez à votre fichier `/etc/hosts` :
```
127.0.0.1 demo.localhost
127.0.0.1 villa1.localhost
```

### Production
Les domaines personnalisés sont détectés automatiquement via l'API backend.

## Structure des dossiers

```
src/
├── app/
│   ├── (hub)/          # Routes publiques du hub
│   ├── admin/          # Routes admin protégées
│   └── [locale]/       # Routes booking avec i18n
├── components/
│   ├── admin/          # Composants du dashboard
│   ├── booking/        # Composants booking
│   ├── hub/            # Composants hub
│   └── shared/         # Composants partagés
├── services/           # Services API
└── middleware.ts       # Gestion hub/admin/tenant
```

## Fonctionnalités

- ✅ Routing unifié pour les 3 modes
- ✅ Authentification pour l'admin
- ✅ Multi-tenancy pour booking
- ✅ Internationalisation (i18n)
- ✅ API client unifié
- ✅ Composants réutilisables