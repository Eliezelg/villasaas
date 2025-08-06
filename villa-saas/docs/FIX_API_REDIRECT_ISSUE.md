# Résolution du problème de redirection API

## Problème identifié

L'API sur api.webpro200.com renvoie des redirections 301 qui causent l'erreur CORS "Redirect is not allowed for preflight request". 

Cause : Conflit entre Railway et Cloudflare sur la gestion SSL/TLS.

## Solution immédiate

### 1. Dans Cloudflare Dashboard

1. Allez dans votre zone **webpro200.com**
2. Allez dans **SSL/TLS** → **Overview**
3. Changez le mode de chiffrement de "Full (strict)" ou "Flexible" vers **"Full"**
   - ⚠️ IMPORTANT : Utilisez "Full" et non "Full (strict)"
   - Cela évite les boucles de redirection avec Railway

### 2. Vérifiez l'enregistrement DNS pour api

1. Dans **DNS** de Cloudflare
2. Trouvez l'enregistrement `api`
3. Assurez-vous que :
   - **Type** : CNAME
   - **Nom** : api
   - **Contenu** : villasaas-production.up.railway.app (ou le domaine Railway fourni)
   - **Proxy** : ✅ Activé (nuage orange)

### 3. Dans Railway (si nécessaire)

Si le domaine personnalisé n'est pas encore ajouté :

1. Dashboard Railway → Projet "tranquil-hope"
2. Service "villasaas" → Settings → Domains
3. Add Custom Domain : `api.webpro200.com`
4. Railway confirmera que le domaine est configuré

## Vérification

Après les changements (attendez 2-3 minutes) :

```bash
# Test direct de l'API
curl -I https://api.webpro200.com/health

# Test CORS
curl -X OPTIONS https://api.webpro200.com/api/properties \
  -H "Origin: https://aviv.webpro200.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type, X-Tenant" \
  -v
```

Le résultat devrait être :
- Status 204 No Content (pour OPTIONS)
- Headers CORS corrects
- Pas de redirection 301

## Pourquoi cette solution fonctionne

1. **Mode "Full"** : Cloudflare chiffre la connexion vers Railway mais accepte n'importe quel certificat SSL
2. **Mode "Full (strict)"** : Cause des problèmes car il vérifie strictement le certificat
3. **Mode "Flexible"** : Cause des boucles car Railway force HTTPS mais Cloudflare envoie HTTP

Railway + Cloudflare nécessite spécifiquement le mode "Full" pour éviter les redirections.