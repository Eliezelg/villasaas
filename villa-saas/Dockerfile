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

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build database package
WORKDIR /app/packages/database
RUN npx prisma generate
RUN npm run build

# Build backend
WORKDIR /app/apps/backend
RUN npm run build

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

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built backend
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/src/emails ./apps/backend/src/emails

# Copy packages with built database
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/packages/utils ./packages/utils
COPY --from=builder /app/packages/i18n ./packages/i18n

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