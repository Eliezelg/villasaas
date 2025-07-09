# ✅ Prochaines étapes Supabase

## 1. Récupérer le mot de passe DB
Dans Supabase Dashboard > Settings > Database > Database password

## 2. Activer pgvector
Dans SQL Editor, exécuter :
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 3. Migrer le schema
```bash
cd villa-saas
./scripts/setup-supabase.sh [VOTRE_MOT_DE_PASSE_DB]
```

## 4. Mettre à jour .env.production
Remplacer `[PASSWORD]` dans `apps/backend/.env.production` :
```
DATABASE_URL="postgresql://postgres.gcswwlhvuymhlzdbgbbh:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres.gcswwlhvuymhlzdbgbbh:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

## 5. Tester la connexion
```bash
cd packages/database
npm run db:studio
```

## 🔒 Sécurité IMPORTANTE

1. **Ne JAMAIS commiter .env.production** - Il est déjà dans .gitignore
2. **Changer les JWT secrets** avant la mise en production
3. **Activer SSL Enforce** dans Supabase Settings > Database

## 📊 Tableau de bord Supabase

Votre projet : https://supabase.com/dashboard/project/gcswwlhvuymhlzdbgbbh

- **Table Editor** : Visualiser vos données
- **SQL Editor** : Exécuter des requêtes
- **Database** : Gérer les connexions et backups
- **Auth** : Non utilisé (vous gérez avec JWT)
- **Storage** : Non utilisé (vous utilisez Cloudflare R2)