# Configuration OVH pour l'enregistrement de domaines

Ce guide explique comment configurer l'intégration avec OVH pour permettre l'achat et la gestion automatique de domaines.

## Prérequis

- Un compte OVH (https://www.ovh.com)
- L'API OVH activée sur votre compte
- Un mode de paiement configuré (carte bancaire ou prélèvement)

## 1. Créer une application OVH

1. Connectez-vous à https://eu.api.ovh.com/createApp/
2. Remplissez le formulaire :
   - **Application name** : Villa SaaS Domain Manager
   - **Application description** : Gestion automatique de domaines pour Villa SaaS
3. Notez les informations fournies :
   - **Application Key** (AK)
   - **Application Secret** (AS)

## 2. Obtenir un Consumer Key

Exécutez cette commande curl en remplaçant YOUR_APP_KEY :

```bash
curl -X POST https://eu.api.ovh.com/1.0/auth/credential \
  -H "X-Ovh-Application: YOUR_APP_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "accessRules": [
      {
        "method": "GET",
        "path": "/domain/*"
      },
      {
        "method": "POST",
        "path": "/domain/*"
      },
      {
        "method": "PUT",
        "path": "/domain/*"
      },
      {
        "method": "DELETE",
        "path": "/domain/*"
      },
      {
        "method": "GET",
        "path": "/order/*"
      },
      {
        "method": "POST",
        "path": "/order/*"
      }
    ]
  }'
```

Cela retournera :
```json
{
  "validationUrl": "https://eu.api.ovh.com/auth/?credentialToken=...",
  "consumerKey": "YOUR_CONSUMER_KEY",
  "state": "pendingValidation"
}
```

1. Ouvrez l'URL de validation dans votre navigateur
2. Connectez-vous avec votre compte OVH
3. Autorisez l'application
4. Notez le Consumer Key

## 3. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# OVH API Configuration
OVH_ENDPOINT=ovh-eu
OVH_APP_KEY=your_application_key
OVH_APP_SECRET=your_application_secret
OVH_CONSUMER_KEY=your_consumer_key
```

## 4. Tarifs des domaines

Les prix varient selon l'extension :

| Extension | Prix/an (approx.) |
|-----------|-------------------|
| .com      | 12€              |
| .fr       | 8€               |
| .eu       | 10€              |
| .net      | 15€              |
| .org      | 15€              |
| .io       | 35€              |
| .co       | 30€              |

## 5. Webhook Stripe

Pour que les achats de domaines fonctionnent, configurez le webhook Stripe :

1. Dans le dashboard Stripe, créez un nouveau webhook endpoint
2. URL : `https://votre-api.com/api/domains/webhook`
3. Événements à écouter : `checkout.session.completed`
4. Notez le secret du webhook et ajoutez-le dans `.env` :

```env
STRIPE_DOMAIN_WEBHOOK_SECRET=whsec_...
```

## 6. Test en mode simulation

Si les variables OVH ne sont pas configurées, le système fonctionne en mode simulation :
- La vérification de disponibilité est simulée
- L'enregistrement retourne un ID simulé
- Les DNS ne sont pas réellement configurés

C'est idéal pour le développement et les tests.

## 7. Limitations et considérations

- **Protection WHOIS** : Activée par défaut pour protéger les données personnelles
- **Auto-renouvellement** : À configurer dans l'interface OVH
- **Transfert de domaine** : Verrouillé pendant 60 jours après l'achat
- **DNS** : La propagation peut prendre jusqu'à 48h

## 8. Support et documentation

- Documentation API OVH : https://api.ovh.com/
- Console API OVH : https://api.ovh.com/console/
- Support OVH : https://help.ovhcloud.com/

## 9. Redirections DNS automatiques

Le système gère automatiquement les redirections suivantes :

### Redirections de sous-domaine vers domaine personnalisé
- `propriete.villasaas.com` → `www.mavillanice.com` (si configuré)
- Évite le contenu dupliqué pour le SEO

### Redirections www
- `www.mavillanice.com` → `mavillanice.com`
- Force l'utilisation du domaine sans www

### Redirections HTTPS
- `http://mavillanice.com` → `https://mavillanice.com`
- Force l'utilisation du protocole sécurisé

### Configuration Nginx (production)
```nginx
# Redirection du sous-domaine vers le domaine personnalisé
server {
    server_name *.villasaas.com;
    
    location / {
        return 301 $scheme://$custom_domain$request_uri;
    }
}

# Redirection www vers non-www
server {
    server_name www.*;
    
    location / {
        return 301 $scheme://$host$request_uri;
    }
}
```

## Alternative : Namecheap

Si vous préférez utiliser Namecheap :

1. Créez un compte sur https://www.namecheap.com
2. Activez l'API dans votre compte
3. Obtenez votre API Key
4. Modifiez le service `domain-registrar.service.ts` pour utiliser l'API Namecheap

Les variables d'environnement seraient :

```env
NAMECHEAP_API_USER=your_username
NAMECHEAP_API_KEY=your_api_key
NAMECHEAP_CLIENT_IP=your_whitelisted_ip
```