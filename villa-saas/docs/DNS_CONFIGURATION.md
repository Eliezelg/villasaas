# Configuration DNS pour webpro200.fr sur Cloudflare

## 1. Configuration Frontend (Vercel)

### Enregistrement racine
- **Type**: A
- **Nom**: @ (ou webpro200.fr)
- **Contenu**: 76.76.21.21
- **Proxy**: ✅ Activé (orange)
- **TTL**: Auto

### Enregistrement www
- **Type**: CNAME
- **Nom**: www
- **Contenu**: cname.vercel-dns.com
- **Proxy**: ✅ Activé (orange)
- **TTL**: Auto

## 2. Configuration Backend API (Railway)

### Enregistrement API
- **Type**: CNAME
- **Nom**: api
- **Contenu**: villasaas-production.up.railway.app
- **Proxy**: ✅ Activé (orange)
- **TTL**: Auto

## 3. Configuration des sous-domaines dynamiques (pour les clients)

### Enregistrement Wildcard
- **Type**: CNAME
- **Nom**: * (wildcard)
- **Contenu**: cname.vercel-dns.com
- **Proxy**: ✅ Activé (orange)
- **TTL**: Auto

## 4. Configuration SSL/TLS dans Cloudflare

1. Aller dans SSL/TLS → Overview
2. Définir le mode de chiffrement sur "Full (strict)"
3. Activer "Always Use HTTPS"
4. Activer "Automatic HTTPS Rewrites"

## 5. Configuration des Page Rules (optionnel)

### Force HTTPS pour l'API
- **URL**: api.webpro200.fr/*
- **Paramètres**: Always Use HTTPS

## 6. Dans Vercel

1. Ajouter le domaine webpro200.fr dans les paramètres du projet
2. Ajouter www.webpro200.fr
3. Ajouter *.webpro200.fr pour les sous-domaines dynamiques

## 7. Vérification

Après configuration, vérifier avec :
```bash
# Vérifier les enregistrements DNS
dig webpro200.fr
dig www.webpro200.fr
dig api.webpro200.fr

# Tester les URLs
curl -I https://webpro200.fr
curl -I https://api.webpro200.fr
```