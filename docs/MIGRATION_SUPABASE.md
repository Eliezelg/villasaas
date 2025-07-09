# Migration PostgreSQL vers Supabase

## 1. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter les informations suivantes :
   - Project URL
   - API Key (anon)
   - Service Role Key
   - Database Password

## 2. Configuration Database URL

Votre DATABASE_URL Supabase ressemblera à :
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

Pour Prisma, utiliser la connection directe :
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

## 3. Étapes de migration

### 3.1 Sauvegarder les données actuelles
```bash
# Exporter les données actuelles
docker exec -t villa-saas-postgres pg_dump -U postgres villa_saas > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3.2 Mettre à jour .env
```env
# Remplacer
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/villa_saas"

# Par
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Ajouter pour Supabase
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
```

### 3.3 Activer pgvector dans Supabase
```sql
-- Dans Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3.4 Pousser le schema Prisma
```bash
# Depuis packages/database
npx prisma db push
```

### 3.5 Importer les données (optionnel)
```bash
# Si vous avez des données à migrer
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" < backup_XXXXXX.sql
```

## 4. Avantages Supabase

- ✅ Real-time subscriptions natif
- ✅ Row Level Security (RLS) pour multi-tenancy
- ✅ Backups automatiques quotidiens
- ✅ pgvector inclus pour l'IA
- ✅ Dashboard UI pour visualiser les données
- ✅ Edge Functions pour la logique serveur
- ✅ Storage intégré (si besoin plus tard)

## 5. Configuration RLS (optionnel)

Pour activer la sécurité multi-tenant au niveau DB :

```sql
-- Exemple pour la table properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON properties
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

## 6. Vérification

1. Tester la connexion :
```bash
npm run db:studio
```

2. Vérifier que l'app fonctionne :
```bash
npm run dev
```

## Notes

- Supabase limite les connexions simultanées (60 sur le plan gratuit)
- Utiliser PgBouncer pour la production (connection pooling)
- Les migrations Prisma fonctionnent normalement avec Supabase