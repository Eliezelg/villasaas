# Scripts Villa SaaS

Ce dossier contient les scripts utilitaires pour le développement et la maintenance du projet Villa SaaS.

## 🚀 Scripts de Démarrage

- **`start-dev.sh`** : Lance l'environnement de développement complet (backend + frontend)
- **`start-backend.sh`** : Démarre uniquement le serveur backend
- **`start-frontend.sh`** : Démarre uniquement l'application frontend
- **`start-backend-fix.sh`** : Script de démarrage backend avec corrections spécifiques

## 🔧 Scripts d'Installation et Configuration

- **`install.sh`** : Installation complète du projet
- **`install-backend-deps.sh`** : Installation des dépendances backend uniquement
- **`clean-install.sh`** : Réinstallation propre (supprime node_modules et réinstalle)
- **`setup.sh`** : Configuration initiale du projet
- **`setup-test-user.sh`** : Création d'un utilisateur de test

## 📊 Scripts de Base de Données

- **`update-db.sh`** : Met à jour le schéma Prisma et génère le client (⚠️ ESSENTIEL)
- **`generate-prisma.sh`** : Génère uniquement le client Prisma
- **`migrate-images-to-s3.ts`** : Migration des images vers S3/R2

## 🎯 Scripts de Données de Démonstration

- **`create-demo-tenant.sh`** : Crée un tenant de démonstration
- **`add-demo-property.js`** : Ajoute une propriété de démonstration
- **`setup-demo-data.ts`** : Configure un jeu de données complet de démo
- **`create-test-data.js`** : Crée des données de test
- **`setup-public-site.js`** : Configure un site public de démonstration

## 🌐 Scripts de Traduction

- **`translate-i18n.py`** : Script principal de traduction automatique (utilise deep-translator)
- **`run-translation.sh`** : Wrapper pour exécuter les traductions
- **`requirements-translate.txt`** : Dépendances Python pour la traduction

## 🧪 Scripts de Test et Diagnostic

- **`test-endpoints-final.ts`** : Test complet de tous les endpoints API
- **`diagnose-tests.sh`** : Diagnostic des problèmes de tests
- **`fix-tests.sh`** : Corrections automatiques pour les tests
- **`analyze-test-report.py`** : Analyse des rapports de test JSON

## 🔨 Scripts Utilitaires

- **`fix-images-v2.ts`** : Correction des images pour Villa Paradis

## 📝 Notes d'Utilisation

### Commandes Essentielles

```bash
# Développement quotidien
./scripts/start-dev.sh          # Lance tout l'environnement de dev
./scripts/update-db.sh          # Après modification du schema.prisma

# Installation initiale
./scripts/install.sh            # Installation complète
./scripts/setup.sh              # Configuration initiale

# Données de démo
./scripts/create-demo-tenant.sh # Crée un tenant de test
./scripts/add-demo-property.js  # Ajoute une propriété

# Tests
npm run test:endpoints          # ou ./scripts/test-endpoints-final.ts
```

### Ordre d'Exécution pour un Nouveau Développeur

1. `./scripts/install.sh`
2. `./scripts/setup.sh`
3. `./scripts/update-db.sh`
4. `./scripts/create-demo-tenant.sh`
5. `./scripts/add-demo-property.js`
6. `./scripts/start-dev.sh`

## ⚠️ Scripts Critiques

- **`update-db.sh`** : TOUJOURS exécuter après modification du schema Prisma
- **`clean-install.sh`** : Utiliser en cas de problèmes de dépendances

## 🗑️ Nettoyage Effectué

Les scripts suivants ont été supprimés car obsolètes ou redondants :
- Tous les fichiers `test-report-*.json` et `final-test-report-*.json`
- Scripts de test temporaires (`test-health.sh`, `test-api.sh`, etc.)
- Scripts de traduction doublons (`complete-translations.js`, etc.)
- Scripts obsolètes (`start-booking.sh`, `setup-supabase.sh`)