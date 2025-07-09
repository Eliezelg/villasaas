# 🔗 Configuration de connexion Supabase

## Information importante sur la connexion

Votre projet Supabase `gcswwlhvuymhlzdbgbbh` nécessite la bonne région dans l'URL de connexion.

### Pour trouver votre URL de connexion exacte :

1. Allez sur https://supabase.com/dashboard/project/gcswwlhvuymhlzdbgbbh
2. Cliquez sur le bouton **"Connect"** en haut à droite
3. Sélectionnez l'onglet **"ORMs"**
4. Choisissez **"Prisma"**
5. Copiez l'URL de connexion exacte

### Format des URLs Supabase

L'URL de connexion suit ce format :
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:[PORT]/postgres
```

Les régions possibles sont :
- `us-east-1` (US East)
- `us-west-1` (US West)
- `eu-west-1` (EU Ireland)
- `eu-west-2` (EU London)
- `eu-west-3` (EU Paris)
- `eu-central-1` (EU Frankfurt)
- `ap-southeast-1` (Singapore)
- `ap-northeast-1` (Tokyo)
- `ap-south-1` (Mumbai)
- `ap-southeast-2` (Sydney)
- `sa-east-1` (São Paulo)
- `ca-central-1` (Canada)

### Mot de passe avec caractères spéciaux

Votre mot de passe contient des caractères spéciaux qui doivent être encodés :
- Original : `Grenoble10@@,1006`
- Encodé : `Grenoble10%40%40%2C1006`

### Une fois la bonne URL trouvée

1. Mettez à jour `packages/database/.env`
2. Mettez à jour `apps/backend/.env.production`
3. Exécutez :
   ```bash
   cd packages/database
   npx prisma db push
   ```