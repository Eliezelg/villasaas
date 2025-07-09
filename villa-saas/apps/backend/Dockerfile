# Dockerfile pour le backend Villa SaaS
FROM node:20-alpine AS builder

# Install dependencies for sharp
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copier la structure du monorepo
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages ./packages/

# Installer toutes les dépendances du monorepo
RUN npm install

# Copier le code du backend
COPY apps/backend ./apps/backend

# Build
WORKDIR /app/apps/backend
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copier depuis le builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package*.json ./
COPY --from=builder /app/apps/backend/src/emails ./src/emails

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/server.js"]