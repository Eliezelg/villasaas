# Guide de Configuration d'un Domaine Personnalisé

## Vue d'ensemble

Villa SaaS supporte trois options de domaine pour votre site de réservation :

1. **Sous-domaine gratuit** : `votresite.villasaas.com` (Gratuit)
2. **Domaine personnalisé acheté** : `votresite.com` (2€/mois)
3. **Domaine existant connecté** : Votre domaine actuel (Gratuit)

## Option 1 : Sous-domaine Gratuit

C'est l'option la plus simple et la plus rapide. Lors de votre inscription, choisissez simplement un sous-domaine disponible. Votre site sera immédiatement accessible à l'adresse `votresubdomaine.villasaas.com`.

### Avantages :
- Configuration instantanée
- SSL/HTTPS inclus automatiquement
- Aucune configuration technique requise
- Gratuit à vie

## Option 2 : Acheter un Domaine

Si vous souhaitez un domaine personnalisé (ex: `mavilla.com`), vous pouvez l'acheter directement via Villa SaaS.

### Prix : 2€/mois
- Inclut l'enregistrement du domaine
- Configuration automatique
- SSL/HTTPS inclus
- Renouvellement automatique

### Comment faire :
1. Après inscription, allez dans "Paramètres > Domaine"
2. Cliquez sur "Acheter un domaine"
3. Recherchez et choisissez votre domaine
4. Complétez le paiement
5. Le domaine sera configuré automatiquement sous 24h

## Option 3 : Connecter un Domaine Existant

Si vous possédez déjà un domaine, vous pouvez le connecter à Villa SaaS.

### Prérequis :
- Accès à votre registraire de domaine (OVH, GoDaddy, etc.)
- Capacité à modifier les enregistrements DNS

### Configuration DNS

Vous devez ajouter les enregistrements DNS suivants chez votre registraire :

#### Pour le domaine principal (www.votredomaine.com) :
```
Type: CNAME
Nom: www
Valeur: cname.vercel-dns.com
TTL: 3600
```

#### Pour le domaine racine (votredomaine.com) :
```
Type: A
Nom: @
Valeur: 76.76.21.21
TTL: 3600
```

### Étapes détaillées :

1. **Connectez-vous à votre registraire de domaine**
   - OVH : manager.ovh.com
   - GoDaddy : godaddy.com
   - Gandi : gandi.net
   - Etc.

2. **Accédez à la gestion DNS**
   - Cherchez "Zone DNS", "DNS Management" ou "Gérer DNS"

3. **Supprimez les anciens enregistrements**
   - Supprimez tout enregistrement A ou CNAME existant pour @ et www

4. **Ajoutez les nouveaux enregistrements**
   - Ajoutez les enregistrements mentionnés ci-dessus

5. **Attendez la propagation**
   - Les changements DNS peuvent prendre jusqu'à 48h pour se propager
   - Généralement actifs en 1-4 heures

6. **Validez dans Villa SaaS**
   - Allez dans "Paramètres > Domaine"
   - Cliquez sur "Valider le domaine"
   - Le SSL sera automatiquement configuré

### Dépannage

**Le domaine ne fonctionne pas après 48h :**
- Vérifiez que les enregistrements DNS sont corrects
- Utilisez un outil comme [whatsmydns.net](https://whatsmydns.net) pour vérifier la propagation
- Contactez notre support

**Erreur SSL :**
- Le certificat SSL est généré automatiquement après validation
- Cela peut prendre jusqu'à 1 heure après la validation du domaine

## Support Technique

Pour toute question ou assistance :
- Email : support@villasaas.com
- Documentation : docs.villasaas.com
- Chat en direct : Disponible dans votre dashboard

## FAQ

**Puis-je changer de domaine plus tard ?**
Oui, vous pouvez changer de domaine à tout moment depuis vos paramètres.

**Puis-je utiliser plusieurs domaines ?**
Oui, vous pouvez ajouter des domaines supplémentaires (frais additionnels peuvent s'appliquer).

**Mon email sera-t-il affecté ?**
Non, nous ne modifions que les enregistrements web. Vos emails continueront de fonctionner normalement.

**Puis-je utiliser un sous-domaine de mon domaine ?**
Oui, vous pouvez connecter `booking.mondomaine.com` au lieu du domaine principal.