# Architecture des Domaines - Villa SaaS

## Vue d'ensemble

Villa SaaS utilise une architecture multi-domaines pour séparer l'administration centralisée des sites publics de réservation.

## Structure des domaines

### 1. Domaine Principal - Administration
- **URL** : `www.webpro200.fr`
- **Fonction** : Portail d'administration centralisé
- **Utilisateurs** : Tous les propriétaires/admins se connectent ici
- **Contenu** : 
  - Tableau de bord de gestion
  - Gestion des propriétés
  - Gestion des réservations
  - Analytics et rapports
  - Paramètres du compte

### 2. Sous-domaines - Sites Publics
- **URL** : `[subdomain].webpro200.fr`
- **Fonction** : Sites publics de réservation pour chaque client
- **Utilisateurs** : Visiteurs/voyageurs qui veulent réserver
- **Contenu** :
  - Liste des propriétés du client
  - Système de réservation
  - Calendrier de disponibilité
  - Informations de contact

### 3. Domaines Personnalisés (Optionnel)
- **URL** : `www.client-domain.com`
- **Fonction** : Domaine personnalisé pointant vers le site public du client
- **Configuration** : Via Vercel API
- **SSL** : Automatique via Vercel

## Flux d'inscription

1. **Inscription sur www.webpro200.fr**
   - Le client s'inscrit sur le domaine principal
   - Il choisit son sous-domaine (ex: `villa-martin`)
   - Son site public est créé automatiquement : `villa-martin.webpro200.fr`

2. **Accès après inscription**
   - **Admin** : Se connecte sur `www.webpro200.fr/admin/login`
   - **Site public** : Accessible sur `villa-martin.webpro200.fr`

3. **Domaine personnalisé (plus tard)**
   - Le client peut configurer un domaine personnalisé
   - Ex: `www.villa-martin-cannes.com` → `villa-martin.webpro200.fr`

## Configuration technique

### PublicSite Model
```prisma
model PublicSite {
  // Configuration domaine
  domain        String?  @unique  // Domaine personnalisé (ex: www.villa-martin-cannes.com)
  subdomain     String?  @unique  // Sous-domaine (ex: villa-martin)
  
  // Le site est accessible via:
  // 1. subdomain.webpro200.fr
  // 2. domain (si configuré)
}
```

### Tenant Model
```prisma
model Tenant {
  subdomain     String   @unique  // Identifiant unique du client
  customDomain  String?  // Domaine personnalisé optionnel
}
```

## Résolution des domaines

### 1. Requête sur www.webpro200.fr
- Redirection vers `/admin/login` ou `/admin/dashboard`
- Authentification requise
- Accès multi-tenant (un compte peut gérer plusieurs tenants)

### 2. Requête sur [subdomain].webpro200.fr
- Lookup dans PublicSite par subdomain
- Affichage du site public du tenant
- Pas d'authentification requise

### 3. Requête sur domaine personnalisé
- Lookup dans PublicSite par domain
- Affichage du site public du tenant
- Configuration DNS requise (CNAME vers cname.vercel-dns.com)

## Exemples concrets

### Client "Villa Martin"
- **Admin** : Se connecte sur `www.webpro200.fr`
- **Site public** : `villa-martin.webpro200.fr`
- **Domaine perso** : `www.villa-martin-cannes.com` (optionnel)

### Client "Résidence Azur"
- **Admin** : Se connecte sur `www.webpro200.fr`
- **Site public** : `residence-azur.webpro200.fr`
- **Domaine perso** : `www.residence-azur.fr` (optionnel)

## Avantages de cette architecture

1. **Centralisation** : Un seul point d'entrée pour tous les admins
2. **Simplicité** : Les clients n'ont qu'une URL à retenir pour l'admin
3. **Flexibilité** : Possibilité d'avoir un domaine personnalisé
4. **Sécurité** : Séparation claire entre admin et sites publics
5. **Multi-tenancy** : Un utilisateur peut gérer plusieurs propriétés/tenants

## Configuration Vercel

Le projet doit être configuré sur Vercel pour accepter :
- `www.webpro200.fr` (domaine principal)
- `*.webpro200.fr` (wildcard pour les sous-domaines)
- Tous les domaines personnalisés ajoutés dynamiquement via l'API Vercel