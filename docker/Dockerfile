# Stage 1: Build
FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY src/prisma ./src/prisma
RUN npx prisma generate

# Copy TypeScript config and source, then build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Run
FROM node:20-slim

# Install dependencies: OpenSSL + netcat-openbsd + curl
RUN apt-get update && apt-get install -y openssl netcat-openbsd curl

WORKDIR /app

# Copy build artifacts and node_modules from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy Prisma schema
COPY --from=builder /app/src/prisma ./src/prisma

# Copy entrypoint script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENV NODE_ENV=production
EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]