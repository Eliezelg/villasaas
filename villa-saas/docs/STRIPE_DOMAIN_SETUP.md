# Configuration des domaines Stripe pour Apple Pay et Google Pay

## Domaines à enregistrer

Les domaines suivants doivent être enregistrés dans Stripe pour activer Apple Pay et Google Pay :

- `webpro200.com` - Domaine principal
- `www.webpro200.com` - Sous-domaine www
- `api.webpro200.com` - API backend
- `villasaas-eight.vercel.app` - Domaine Vercel actuel

**Note importante** : Les wildcards (*.webpro200.com) ne sont pas supportés par Stripe. Chaque sous-domaine client devra être enregistré individuellement lorsqu'il sera créé.

## Méthode 1 : Dashboard Stripe (Recommandé)

1. Connectez-vous à https://dashboard.stripe.com
2. Naviguez vers **Settings** → **Payment Method Domains**
3. Cliquez sur **"Add new domain"**
4. Ajoutez chaque domaine un par un
5. Stripe vérifiera automatiquement les domaines

## Méthode 2 : Script automatisé

Un script a été créé pour automatiser l'enregistrement :

```bash
cd /home/eli/Documents/Villacustom/villa-saas/scripts
export STRIPE_SECRET_KEY="sk_live_..."  # Remplacez par votre clé
node register-stripe-domains.js
```

## Méthode 3 : API Stripe

Pour enregistrer manuellement via l'API :

```bash
# Exemple pour un domaine
curl https://api.stripe.com/v1/apple_pay/domains \
  -u "sk_live_...:" \
  -d domain_name="webpro200.com"
```

## Vérification

Après l'enregistrement, vérifiez que les domaines sont bien enregistrés :

```bash
curl https://api.stripe.com/v1/apple_pay/domains \
  -u "sk_live_...:" \
  -G
```

## Notes importantes

- **Chaque domaine et sous-domaine doit être enregistré séparément**
- Les domaines doivent être vérifiés et accessibles via HTTPS
- L'enregistrement est nécessaire pour les environnements test et production
- **Les wildcards ne sont PAS supportés** - chaque sous-domaine client doit être enregistré individuellement
- Pour automatiser l'enregistrement des sous-domaines clients, implémentez un webhook lors de la création de domaine

## Webhooks Stripe

Les webhooks Stripe sont déjà configurés dans le code pour accepter les requêtes depuis :
- `/api/public/stripe/webhook` - Webhooks de paiement
- `/api/public/stripe/subscription-webhook` - Webhooks d'abonnement

Assurez-vous que les URLs de webhook dans Stripe pointent vers :
- Production : `https://api.webpro200.com/api/public/stripe/webhook`
- Abonnements : `https://api.webpro200.com/api/public/stripe/subscription-webhook`