# Guide de Déploiement Villa SaaS

Ce guide détaille les étapes pour déployer Villa SaaS en production.

## Table des matières

1. [Prérequis](#prérequis)
2. [Configuration](#configuration)
3. [Base de données](#base-de-données)
4. [Applications](#applications)
5. [Services externes](#services-externes)
6. [Domaines et SSL](#domaines-et-ssl)
7. [Monitoring](#monitoring)
8. [Maintenance](#maintenance)

## Prérequis

### Infrastructure
- **Serveur**: VPS ou dédié avec minimum 4GB RAM
- **OS**: Ubuntu 22.04 LTS recommandé
- **Node.js**: Version 20.x
- **Docker**: Pour PostgreSQL et Redis
- **Nginx**: Pour reverse proxy
- **PM2**: Pour la gestion des processus Node.js

### Services externes
- **AWS S3**: Pour le stockage des images
- **Stripe**: Pour les paiements
- **Resend**: Pour l'envoi d'emails
- **Domaine**: Pour l'application principale et les sous-domaines

## Configuration

### 1. Variables d'environnement

Créer les fichiers `.env` pour chaque application :

#### Backend (`apps/backend/.env`)
```env
# Application
NODE_ENV=production
PORT=3001
API_URL=https://api.votre-domaine.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/villa_saas?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=votre-secret-jwt-tres-long
JWT_REFRESH_SECRET=votre-secret-refresh-jwt-tres-long

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_ACCESS_KEY_ID=votre-access-key
AWS_SECRET_ACCESS_KEY=votre-secret-key
AWS_REGION=eu-west-3
AWS_S3_BUCKET=votre-bucket-name

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@votre-domaine.com

# CORS
CORS_ORIGIN=https://app.votre-domaine.com,https://booking.votre-domaine.com
```

#### Dashboard Web (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
NEXT_PUBLIC_APP_URL=https://app.votre-domaine.com
```

#### Booking App (`apps/booking/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
NEXT_PUBLIC_BOOKING_URL=https://booking.votre-domaine.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=XXXXXXXXXXXXXXXXX
```

### 2. Installation des dépendances

```bash
# Cloner le repository
git clone https://github.com/votre-repo/villa-saas.git
cd villa-saas

# Installer les dépendances
npm install

# Build toutes les applications
npm run build
```

## Base de données

### 1. PostgreSQL avec Docker

```bash
# docker-compose.yml pour production
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: villa_saas_db
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: villa_saas
      POSTGRES_USER: villa_user
      POSTGRES_PASSWORD: votre-mot-de-passe-secure
      PGDATA: /var/lib/postgresql/data
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    container_name: villa_saas_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

### 2. Initialisation de la base

```bash
# Démarrer les services
docker-compose up -d

# Appliquer les migrations
cd villa-saas
npx prisma migrate deploy

# Optionnel : Seed initial
npm run db:seed
```

## Applications

### 1. Backend API avec PM2

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'villa-saas-api',
    cwd: './apps/backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/villa-saas/api-error.log',
    out_file: '/var/log/villa-saas/api-out.log',
    log_file: '/var/log/villa-saas/api-combined.log',
    time: true
  }]
}

# Démarrer
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Applications Next.js

#### Dashboard Admin
```bash
# ecosystem.dashboard.config.js
module.exports = {
  apps: [{
    name: 'villa-saas-dashboard',
    cwd: './apps/web',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

pm2 start ecosystem.dashboard.config.js
```

#### Booking App
```bash
# ecosystem.booking.config.js
module.exports = {
  apps: [{
    name: 'villa-saas-booking',
    cwd: './apps/booking',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
}

pm2 start ecosystem.booking.config.js
```

### 3. Configuration Nginx

```nginx
# /etc/nginx/sites-available/villa-saas

# API Backend
server {
    listen 80;
    server_name api.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/api.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.votre-domaine.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts pour uploads
        client_max_body_size 50M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Dashboard Admin
server {
    listen 80;
    server_name app.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/app.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.votre-domaine.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Booking App (wildcard pour sous-domaines)
server {
    listen 80;
    server_name booking.votre-domaine.com *.booking.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name booking.votre-domaine.com *.booking.votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/booking.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/booking.votre-domaine.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer la configuration
sudo ln -s /etc/nginx/sites-available/villa-saas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Services externes

### 1. AWS S3

1. Créer un bucket S3 dans la région souhaitée
2. Configurer la politique CORS :

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["https://app.votre-domaine.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

3. Créer un utilisateur IAM avec les permissions :
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::votre-bucket/*"
        }
    ]
}
```

### 2. Stripe

1. Configurer les webhooks dans le dashboard Stripe :
   - Endpoint: `https://api.votre-domaine.com/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.failed`

2. Configurer Stripe Connect si multi-tenant

### 3. Resend

1. Vérifier le domaine dans Resend
2. Configurer les enregistrements DNS
3. Tester l'envoi d'emails

## Domaines et SSL

### 1. Certificats SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Générer les certificats
sudo certbot --nginx -d api.votre-domaine.com
sudo certbot --nginx -d app.votre-domaine.com
sudo certbot --nginx -d booking.votre-domaine.com -d *.booking.votre-domaine.com

# Renouvellement automatique
sudo systemctl enable certbot.timer
```

### 2. Configuration DNS

```
# Enregistrements DNS nécessaires
A     @                    -> IP_SERVEUR
A     api                  -> IP_SERVEUR
A     app                  -> IP_SERVEUR
A     booking              -> IP_SERVEUR
A     *.booking            -> IP_SERVEUR

# Pour Resend
TXT   _dmarc               -> v=DMARC1; p=none;
TXT   resend._domainkey    -> [clé fournie par Resend]
```

## Monitoring

### 1. Logs

```bash
# Logs PM2
pm2 logs villa-saas-api
pm2 logs villa-saas-dashboard
pm2 logs villa-saas-booking

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 2. Monitoring avec PM2

```bash
# Interface web PM2
pm2 install pm2-logrotate
pm2 web

# Metrics
pm2 monit
```

### 3. Backups automatiques

```bash
# backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/villa-saas"

# Backup PostgreSQL
docker exec villa_saas_db pg_dump -U villa_user villa_saas > $BACKUP_DIR/db_$DATE.sql

# Backup des uploads (si stockage local)
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /path/to/uploads

# Garder seulement 7 jours
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Crontab
# 0 3 * * * /path/to/backup.sh
```

## Maintenance

### 1. Mises à jour

```bash
# Pull les dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install

# Build
npm run build

# Appliquer les migrations
npx prisma migrate deploy

# Redémarrer les services
pm2 restart all
```

### 2. Rollback

```bash
# Revenir à une version précédente
git checkout <commit-hash>

# Rebuild et redémarrer
npm install
npm run build
pm2 restart all
```

### 3. Monitoring des performances

- Utiliser Google PageSpeed Insights pour les performances frontend
- Configurer Google Analytics pour le suivi des utilisateurs
- Monitorer les temps de réponse API avec PM2 ou DataDog
- Vérifier régulièrement les logs d'erreur

## Sécurité

### 1. Firewall

```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2ban

```bash
# Installation
sudo apt install fail2ban

# Configuration pour Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
```

### 3. Updates de sécurité

```bash
# Updates automatiques
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## Troubleshooting

### Problèmes courants

1. **502 Bad Gateway**
   - Vérifier que PM2 est démarré : `pm2 status`
   - Vérifier les logs : `pm2 logs`

2. **Problèmes de connexion DB**
   - Vérifier Docker : `docker ps`
   - Tester la connexion : `psql -U villa_user -h localhost villa_saas`

3. **Uploads qui échouent**
   - Vérifier les permissions S3
   - Vérifier `client_max_body_size` dans Nginx

4. **Emails non envoyés**
   - Vérifier les logs Resend
   - Vérifier la configuration DNS

## Support

Pour toute question ou problème :
- Documentation : https://docs.villa-saas.com
- Support : support@villa-saas.com