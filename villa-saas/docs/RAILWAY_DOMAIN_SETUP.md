# Configuration du domaine Railway pour api.webpro200.com

## État actuel

- **DNS** : api.webpro200.com pointe vers des IPs Cloudflare (188.114.97.7, 188.114.96.7)
- **Railway** : Le domaine personnalisé n'est pas encore configuré
- **Variables** : BACKEND_URL mise à jour vers https://api.webpro200.com
- **Déploiement** : En cours (BUILDING)

## Actions requises

### 1. Sur Railway Dashboard

1. Allez sur https://railway.app/dashboard
2. Sélectionnez le projet **"tranquil-hope"**
3. Cliquez sur le service **"villasaas"**
4. Allez dans **Settings** → **Domains**
5. Cliquez sur **"Add Custom Domain"**
6. Entrez : `api.webpro200.com`
7. Railway vous fournira un domaine cible (ex: `villasaas-production.up.railway.app`)

### 2. Sur Cloudflare Dashboard

1. Allez dans votre compte Cloudflare
2. Sélectionnez le domaine **webpro200.com**
3. Allez dans **DNS**
4. Trouvez l'enregistrement pour `api` (actuellement type A)
5. **Modifiez-le** en CNAME :
   - **Type** : CNAME
   - **Nom** : api
   - **Contenu** : Le domaine fourni par Railway (ex: `villasaas-production.up.railway.app`)
   - **Proxy** : ✅ Activé (orange)
   - **TTL** : Auto

### 3. Vérification

Après la configuration, vérifiez avec :

```bash
# Vérifier le CNAME
dig api.webpro200.com CNAME

# Tester l'API
curl -I https://api.webpro200.com/health

# Tester CORS
curl -I https://api.webpro200.com/api/auth/me \
  -H "Origin: https://www.webpro200.com"
```

## Variables d'environnement mises à jour

- `BACKEND_URL`: https://api.webpro200.com
- `FRONTEND_URL`: https://webpro200.com
- `ALLOWED_BOOKING_DOMAINS`: villasaas-eight.vercel.app,webpro200.com,www.webpro200.com

## Domaines Railway actuels

- villasaas-production.up.railway.app (domaine par défaut)
- villasaas-production-3393.up.railway.app (domaine généré)

## Notes importantes

- Le proxy Cloudflare doit être activé pour HTTPS
- Railway génère automatiquement un certificat SSL
- Les changements DNS peuvent prendre jusqu'à 5 minutes
- Le déploiement Railway prend généralement 2-5 minutes