# Configuration des Sous-domaines avec Vercel et Cloudflare

## Problème

Vercel ne supporte pas nativement les domaines wildcard (*.webpro200.fr). Chaque sous-domaine doit être configuré individuellement.

## Solutions

### Option 1 : Configuration Manuelle (Recommandée pour quelques clients)

#### Étape 1 : Ajouter le domaine dans Vercel

1. Allez dans le dashboard Vercel
2. Sélectionnez votre projet
3. Settings → Domains
4. Cliquez sur "Add"
5. Entrez le sous-domaine complet : `aviv.webpro200.fr`
6. Vercel affichera : "Invalid Configuration: A valid CNAME record was not found"

#### Étape 2 : Configurer DNS dans Cloudflare

1. Dans Cloudflare, modifiez/créez l'enregistrement DNS :
   - **Type** : CNAME
   - **Nom** : aviv
   - **Cible** : `cname.vercel-dns.com`
   - **Proxy** : Désactivé (nuage gris)

2. Attendez 1-2 minutes pour la propagation

3. Retournez dans Vercel et cliquez sur "Refresh" - le domaine devrait être validé

### Option 2 : Automatisation avec l'API Vercel (Pour scale)

L'intégration est déjà en place dans le code. Configurez ces variables dans Railway :

```env
VERCEL_API_TOKEN="votre-token-vercel"
VERCEL_PROJECT_ID="votre-project-id"
VERCEL_TEAM_ID="votre-team-id" # optionnel
```

Cela ajoutera automatiquement les domaines dans Vercel lors de l'inscription.

### Option 3 : Architecture Alternative (Solution à long terme)

Pour éviter cette limitation, considérez :

1. **Un seul domaine avec paths** : `webpro200.fr/aviv` au lieu de `aviv.webpro200.fr`
2. **Proxy inverse** : Nginx/Caddy sur un VPS qui route vers Vercel
3. **Edge Functions** : Utiliser Cloudflare Workers pour router les requêtes

## Configuration SSL avec Cloudflare

### Si vous utilisez le proxy Cloudflare (nuage orange) :

1. **Mode SSL** : Définir sur "Flexible"
2. **Problème** : Ne fonctionne pas bien avec Vercel qui force HTTPS

### Si vous désactivez le proxy Cloudflare (nuage gris) :

1. **SSL** : Géré automatiquement par Vercel
2. **Avantage** : Configuration plus simple
3. **Inconvénient** : Pas de CDN Cloudflare

## Dépannage

### Erreur 525 (SSL handshake failed)

- Se produit quand le proxy Cloudflare est activé avec Vercel
- Solution : Désactiver le proxy (nuage gris)

### Le sous-domaine ne fonctionne pas

1. Vérifiez que le domaine est validé dans Vercel
2. Vérifiez que le CNAME pointe vers `cname.vercel-dns.com`
3. Assurez-vous que le proxy Cloudflare est désactivé

### "Invalid Configuration" dans Vercel

- Le CNAME n'est pas correctement configuré
- Attendez la propagation DNS (jusqu'à 48h, généralement 5 min)

## Recommandation

Pour Villa SaaS avec plusieurs clients :

1. **Court terme** : Configuration manuelle pour chaque client
2. **Moyen terme** : Automatisation avec l'API Vercel
3. **Long terme** : Repenser l'architecture pour éviter les limitations

## Exemple de Configuration Correcte

Pour `aviv.webpro200.fr` :

**Cloudflare DNS :**
```
Type: CNAME
Name: aviv
Content: cname.vercel-dns.com
Proxy status: DNS only (gris)
TTL: Auto
```

**Vercel :**
- Domain: aviv.webpro200.fr
- Status: Valid Configuration ✓
- SSL: Automatic