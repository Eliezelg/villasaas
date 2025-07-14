# Recommandations d'Organisation des Fichiers .md - Villa SaaS

## 📁 Fichiers à Supprimer (Obsolètes ou Temporaires)

### 1. Fichiers de migration/configuration temporaires ❌
- `MIGRATION_STATUS.md` - Information temporaire, statut de migration déjà complété
- `NEXT_STEPS_SUPABASE.md` - Instructions temporaires pour configuration Supabase
- `SUPABASE_CONNECTION_INFO.md` - Information spécifique de connexion qui ne devrait pas être dans le repo
- `TEST_REPORT.md` - Rapport de test ponctuel d'une date spécifique (7 juillet 2025)
- `TYPESCRIPT_ERRORS_ANALYSIS.md` - Analyse temporaire d'erreurs déjà corrigées

### 2. Fichiers redondants ❌
- `DEPLOYMENT_GUIDE.md` (racine) - Doublon avec `docs/deployment/DEPLOYMENT_GUIDE.md`

## 📂 Fichiers à Déplacer dans docs/

### 1. Documentation de déploiement → `docs/deployment/`
- `CLOUDFLARE_R2_SETUP.md` → `docs/deployment/CLOUDFLARE_R2_SETUP.md`
- `OPENAI_SETUP.md` → `docs/deployment/OPENAI_SETUP.md`
- `STRIPE_SETUP.md` → `docs/deployment/STRIPE_SETUP.md`
- `STRIPE_BILLING_SETUP.md` → `docs/deployment/STRIPE_BILLING_SETUP.md`
- `STRIPE_OAUTH_IMPLEMENTATION.md` → `docs/deployment/STRIPE_OAUTH_IMPLEMENTATION.md`

### 2. Documentation de sécurité → `docs/security/`
- `SECURITY_AUDIT_REPORT.md` → `docs/security/SECURITY_AUDIT_REPORT.md`
- `SECURITY_FIXES_COMPLETED.md` → `docs/security/SECURITY_FIXES_COMPLETED.md`
- `STRIPE_SECURITY_AUDIT.md` → `docs/security/STRIPE_SECURITY_AUDIT.md`

### 3. Guides de développement → `docs/guides/`
- `MIGRATION_GUIDE.md` → `docs/guides/MIGRATION_GUIDE.md`
- `TRANSLATION_GUIDE.md` → `docs/guides/TRANSLATION_GUIDE.md`

### 4. Gestion du projet → `docs/development/`
- `TODO_REMAINING.md` → `docs/development/TODO_REMAINING.md`

## ✅ Fichiers à Garder à la Racine

### 1. Fichiers essentiels
- `README.md` - Point d'entrée principal du projet, doit rester à la racine
- `CLAUDE.md` - Instructions importantes pour l'AI, utile à la racine pour un accès rapide

## 📋 Actions Recommandées

### 1. Suppression immédiate
```bash
# Supprimer les fichiers temporaires et obsolètes
rm MIGRATION_STATUS.md
rm NEXT_STEPS_SUPABASE.md
rm SUPABASE_CONNECTION_INFO.md
rm TEST_REPORT.md
rm TYPESCRIPT_ERRORS_ANALYSIS.md
rm DEPLOYMENT_GUIDE.md  # Garder seulement celui dans docs/
```

### 2. Déplacement et organisation
```bash
# Créer les sous-dossiers si nécessaire
mkdir -p docs/deployment
mkdir -p docs/security
mkdir -p docs/guides
mkdir -p docs/development

# Déplacer les fichiers de déploiement
mv CLOUDFLARE_R2_SETUP.md docs/deployment/
mv OPENAI_SETUP.md docs/deployment/
mv STRIPE_SETUP.md docs/deployment/
mv STRIPE_BILLING_SETUP.md docs/deployment/
mv STRIPE_OAUTH_IMPLEMENTATION.md docs/deployment/

# Déplacer les fichiers de sécurité
mv SECURITY_AUDIT_REPORT.md docs/security/
mv SECURITY_FIXES_COMPLETED.md docs/security/
mv STRIPE_SECURITY_AUDIT.md docs/security/

# Déplacer les guides
mv MIGRATION_GUIDE.md docs/guides/
mv TRANSLATION_GUIDE.md docs/guides/

# Déplacer la gestion de projet
mv TODO_REMAINING.md docs/development/
```

### 3. Mise à jour du README principal
Après le déplacement, mettre à jour les liens dans le README.md principal pour pointer vers les nouveaux emplacements dans docs/.

## 🎯 Résultat Attendu

### Structure finale à la racine :
```
villa-saas/
├── README.md          # Documentation principale
├── CLAUDE.md          # Instructions AI
├── docs/              # Toute la documentation organisée
│   ├── README.md      # Index de la documentation
│   ├── deployment/    # Guides de déploiement et configuration
│   ├── security/      # Rapports et analyses de sécurité
│   ├── guides/        # Guides divers
│   ├── development/   # Gestion du projet et TODOs
│   ├── architecture/  # Architecture technique
│   ├── api/          # Documentation API
│   └── releases/     # Notes de version
```

## 📝 Notes

- Les fichiers contenant des informations sensibles (comme `SUPABASE_CONNECTION_INFO.md`) ne devraient jamais être committés
- Les rapports de tests ponctuels devraient être dans un dossier `tests/reports/` avec des dates claires
- Les analyses temporaires d'erreurs devraient être dans des issues GitHub plutôt que des fichiers .md