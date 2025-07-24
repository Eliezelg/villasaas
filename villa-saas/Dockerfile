# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/database/package*.json ./packages/database/
COPY packages/types/package*.json ./packages/types/
COPY packages/utils/package*.json ./packages/utils/
COPY packages/i18n/package*.json ./packages/i18n/

# Copy Prisma schema before install (needed for postinstall)
COPY packages/database/prisma ./packages/database/prisma

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build all packages in order
WORKDIR /app
RUN cd packages/database && npm run build
RUN cd packages/utils && npm run build
RUN cd packages/types && npm run build
RUN cd packages/i18n && npm run build

# Build backend
RUN cd apps/backend && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/database/package*.json ./packages/database/
COPY packages/types/package*.json ./packages/types/
COPY packages/utils/package*.json ./packages/utils/
COPY packages/i18n/package*.json ./packages/i18n/

# Copy Prisma schema before install (needed for postinstall)
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built backend
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/src/emails ./apps/backend/src/emails

# Copy all built packages
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/node_modules/.prisma ./packages/database/node_modules/.prisma

COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/

COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/

COPY --from=builder /app/packages/i18n/dist ./packages/i18n/dist
COPY --from=builder /app/packages/i18n/package.json ./packages/i18n/

# Generate Prisma client in production
WORKDIR /app/packages/database
RUN npx prisma generate

# Set working directory to backend
WORKDIR /app/apps/backend

# Environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Expose port (Railway will set PORT env variable)
EXPOSE 3001

# Start the server
CMD ["node", "dist/server.js"]