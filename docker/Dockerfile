# Stage 1: Build
FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package.json package-lock.json ./

# Prevent prepare script from running
ENV npm_config_ignore_scripts=true

# Install production dependencies
RUN npm ci

# Copy Prisma schema and generate client
COPY src/prisma ./src/prisma
RUN npx prisma generate

# Copy TypeScript config and source, then build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Run (lean runtime image)
FROM node:20-slim

# Install required runtime packages
RUN apt-get update && apt-get install -y openssl curl netcat-openbsd && apt-get clean

WORKDIR /app

# Copy compiled app and runtime deps from build stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/src/prisma ./src/prisma

# Copy and enable entrypoint script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Set environment and expose port
ENV NODE_ENV=production
EXPOSE 8000

# Start script
ENTRYPOINT ["./entrypoint.sh"]
