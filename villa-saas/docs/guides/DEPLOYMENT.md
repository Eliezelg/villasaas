# Villa SaaS Deployment Guide

This guide covers deploying Villa SaaS to production environments.

## 🚀 Deployment Options

### 1. Vercel + Railway (Recommended)
- **Frontend**: Vercel for Next.js
- **Backend**: Railway for Fastify API
- **Database**: Railway PostgreSQL
- **Redis**: Railway Redis

### 2. AWS Full Stack
- **Frontend**: CloudFront + S3
- **Backend**: ECS or Lambda
- **Database**: RDS PostgreSQL
- **Redis**: ElastiCache

### 3. Digital Ocean
- **Frontend**: App Platform
- **Backend**: App Platform or Droplets
- **Database**: Managed PostgreSQL
- **Redis**: Managed Redis

## 📋 Pre-Deployment Checklist

### Environment Variables
Ensure all production environment variables are set:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
JWT_SECRET="strong-random-secret-min-32-chars"
REFRESH_SECRET="another-strong-random-secret"

# Redis
REDIS_URL="redis://user:pass@host:6379"

# Application
NODE_ENV="production"
API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"

# File Upload
UPLOAD_DIR="/app/uploads"
MAX_FILE_SIZE="10485760"

# Email (future)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

### Security Checklist
- [ ] Strong JWT secrets (min 32 characters)
- [ ] HTTPS enabled on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database backups enabled
- [ ] Monitoring and alerts set up

## 🏗️ Build Process

### 1. Build All Packages
```bash
# From project root
npm run build
```

### 2. Backend Build
```bash
cd apps/backend
npm run build
```

Creates optimized build in `apps/backend/dist/`

### 3. Frontend Build
```bash
cd apps/web
npm run build
```

Creates optimized build in `apps/web/.next/`

## 🚀 Deployment Steps

### Option 1: Vercel + Railway

#### Deploy Frontend to Vercel
1. Connect GitHub repository to Vercel
2. Configure:
   ```
   Build Command: cd apps/web && npm run build
   Output Directory: apps/web/.next
   Install Command: npm install
   ```
3. Set environment variables in Vercel dashboard
4. Deploy

#### Deploy Backend to Railway
1. Create new project in Railway
2. Add PostgreSQL and Redis services
3. Deploy from GitHub with:
   ```
   Build Command: cd apps/backend && npm run build
   Start Command: cd apps/backend && npm start
   ```
4. Set environment variables
5. Get deployment URL for frontend config

### Option 2: Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/ ./packages/
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages ./packages
RUN npm ci --production
EXPOSE 3001
CMD ["npm", "start", "--prefix", "apps/backend"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ ./packages/
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build --prefix apps/web

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package*.json ./apps/web/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start", "--prefix", "apps/web"]
```

### Option 3: Manual VPS Deployment

1. **Setup Server**
   ```bash
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   
   # Install Nginx
   sudo apt-get install nginx
   ```

2. **Deploy Code**
   ```bash
   git clone <repo>
   cd villa-saas
   npm install
   npm run build
   ```

3. **Configure PM2**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [
       {
         name: 'villa-api',
         script: 'npm',
         args: 'start',
         cwd: './apps/backend',
         env: {
           NODE_ENV: 'production',
           PORT: 3001
         }
       },
       {
         name: 'villa-web',
         script: 'npm',
         args: 'start',
         cwd: './apps/web',
         env: {
           NODE_ENV: 'production',
           PORT: 3000
         }
       }
     ]
   };
   ```

4. **Start Services**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## 🔧 Post-Deployment

### 1. Database Migrations
```bash
cd packages/database
npx prisma migrate deploy
```

### 2. Health Checks
- API: `https://api.yourdomain.com/health`
- Frontend: `https://yourdomain.com`

### 3. Monitoring Setup
- Use Sentry for error tracking
- Set up Datadog or New Relic for APM
- Configure CloudWatch or equivalent for logs

### 4. Backup Strategy
- Daily automated database backups
- Weekly full backups
- Test restore procedures regularly

## 📊 Performance Optimization

### CDN Configuration
- Use CloudFlare or AWS CloudFront
- Cache static assets
- Configure proper cache headers

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_property_tenant ON "Property"("tenantId");
CREATE INDEX idx_booking_dates ON "Booking"("checkIn", "checkOut");
CREATE INDEX idx_booking_property ON "Booking"("propertyId");
```

### Redis Caching
- Cache property listings
- Cache availability data
- Cache pricing calculations

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify DATABASE_URL format
- Check network connectivity
- Ensure SSL mode if required

#### File Upload Issues
- Check directory permissions
- Verify disk space
- Ensure upload directory exists

#### Memory Issues
- Increase Node.js heap size: `NODE_OPTIONS="--max-old-space-size=4096"`
- Use PM2 cluster mode
- Implement proper streaming for large files

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit secrets to git
   - Use secret management services
   - Rotate secrets regularly

2. **Network Security**
   - Use VPC/private networks
   - Implement firewall rules
   - Enable DDoS protection

3. **Application Security**
   - Keep dependencies updated
   - Run security audits: `npm audit`
   - Implement CSP headers
   - Use HTTPS everywhere

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (ALB/NLB)
- Run multiple API instances
- Implement session affinity if needed

### Database Scaling
- Read replicas for queries
- Connection pooling
- Consider partitioning for large datasets

### Caching Strategy
- Redis for session storage
- CDN for static assets
- API response caching

## 🎯 Production Readiness Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Error tracking enabled
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] Database indexes created
- [ ] Caching strategy implemented
- [ ] Load testing completed
- [ ] Documentation updated

## 📞 Support

For deployment issues:
1. Check logs in production
2. Review error tracking dashboard
3. Consult monitoring metrics
4. Check this guide for common issues