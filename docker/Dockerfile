# Stage 1: Build
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package.json package-lock.json ./
ENV npm_config_ignore_scripts=true
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

RUN apt-get update && apt-get install -y openssl curl netcat-openbsd && apt-get clean

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

COPY --from=builder /app/src/prisma ./src/prisma
COPY src/config/firebase-service-account.json ./build/config/firebase-service-account.json

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENV NODE_ENV=production
EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
