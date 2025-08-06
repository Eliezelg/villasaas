# Configuration Cloudflare DNS pour Villa SaaS

Ce guide explique comment configurer Cloudflare pour la gestion automatique des DNS lors de la création de nouveaux tenants.

## Prérequis

1. Un compte Cloudflare avec votre domaine principal configuré (ex: webpro200.com)
2. Un certificat SSL qui couvre les sous-domaines (wildcard: *.webpro200.com)

## Étapes de configuration

### 1. Obtenir les clés API Cloudflare

1. Connectez-vous à [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Allez dans "My Profile" → "API Tokens"
3. Cliquez sur "Create Token"
4. Utilisez le template "Edit zone DNS" ou créez un token personnalisé avec ces permissions :
   - Zone → DNS → Edit
   - Zone → Zone → Read
5. Sélectionnez votre zone (webpro200.com)
6. Copiez le token généré

### 2. Obtenir le Zone ID

1. Dans le dashboard Cloudflare, sélectionnez votre domaine
2. Dans la section "API" sur la page d'accueil du domaine
3. Copiez le "Zone ID"

### 3. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` du backend :

```env
# Cloudflare API (for automatic DNS management)
CLOUDFLARE_API_TOKEN="votre-api-token"
CLOUDFLARE_ZONE_ID="votre-zone-id"
CLOUDFLARE_DOMAIN="webpro200.com"
```

### 4. Vérifier le certificat SSL

Pour que les sous-domaines fonctionnent automatiquement avec HTTPS :

1. Dans Cloudflare → SSL/TLS → Edge Certificates
2. Vérifiez que vous avez un certificat qui couvre `*.webpro200.com`
3. Si non, activez "Universal SSL" qui inclut automatiquement les wildcards

### 5. Configuration SSL/TLS

1. Dans Cloudflare → SSL/TLS
2. Définissez le mode sur "Full" ou "Full (strict)"
3. Activez "Always Use HTTPS"

## Fonctionnement

Une fois configuré, le système :

1. **Lors de l'inscription** : Crée automatiquement un enregistrement CNAME pour le sous-domaine choisi
2. **Type d'enregistrement** : CNAME pointant vers `@` (domaine principal)
3. **Proxy Cloudflare** : Activé automatiquement pour bénéficier du SSL et CDN
4. **TTL** : Automatique (1)

## Test manuel

Pour créer manuellement un sous-domaine pour un client existant :

```bash
# Créer un enregistrement DNS
curl -X POST https://api.webpro200.com/api/dns/records \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "test",
    "target": "@"
  }'

# Vérifier un enregistrement
curl https://api.webpro200.com/api/dns/records/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Dépannage

### Erreur 525 (SSL handshake failed)

1. Vérifiez que le mode SSL est sur "Full" et non "Full (strict)"
2. Assurez-vous que votre serveur accepte les connexions HTTPS
3. Vérifiez que le certificat wildcard est actif

### Le sous-domaine ne fonctionne pas

1. Attendez 1-2 minutes pour la propagation DNS
2. Vérifiez dans Cloudflare que l'enregistrement existe
3. Assurez-vous que le proxy (nuage orange) est activé
4. Purgez le cache Cloudflare si nécessaire

### Configuration manuelle temporaire

Si l'automatisation ne fonctionne pas, créez manuellement dans Cloudflare :

1. DNS → Add record
2. Type: CNAME
3. Name: [subdomain]
4. Target: @
5. Proxy status: Proxied (orange cloud)

## Sécurité

- Le token API doit avoir uniquement les permissions DNS nécessaires
- Ne jamais exposer le token dans le code frontend
- Utiliser HTTPS pour toutes les communications
- Limiter les domaines autorisés dans CORS

## Support

Pour toute question sur la configuration Cloudflare, consultez :
- [Documentation Cloudflare DNS](https://developers.cloudflare.com/dns/)
- [API Cloudflare](https://developers.cloudflare.com/api/)